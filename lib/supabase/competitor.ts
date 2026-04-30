import type { SupabaseClient } from '@supabase/supabase-js';

type VelocityPoint = {
    date: string;
    myReviewCount: number;
    competitorReviewCount: number;
    myDailyGrowth: number;
    competitorDailyGrowth: number;
};

type VelocityPayload = {
    competitorStoreId: string;
    myStoreId: string;
    points: VelocityPoint[];
    summary: {
        myGrowth7d: number;
        competitorGrowth7d: number;
        growthGap: number;
    };
};

type DailyReviewSnapshot = {
    snapshot_date: string;
    review_count: number;
};

/**
 * 최근 7일 리뷰 증가 속도를 우리 매장과 경쟁사 매장 간 비교합니다.
 *
 * myReviewLogsTableName는 우리 서비스의 기존 리뷰 로그 테이블명을 연결해서 사용하세요.
 */
export async function fetchReviewVelocityComparison(params: {
    supabase: SupabaseClient;
    competitorStoreId: string;
    myStoreId: string;
    myReviewLogsTableName?: string;
}): Promise<VelocityPayload> {
    const {
        supabase,
        competitorStoreId,
        myStoreId,
        myReviewLogsTableName = 'store_review_logs',
    } = params;

    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 6);
    const sinceDate = since.toISOString().slice(0, 10);

    const [competitorRes, myRes] = await Promise.all([
        supabase
            .from('competitor_review_logs')
            .select('snapshot_date, review_count')
            .eq('competitor_store_id', competitorStoreId)
            .gte('snapshot_date', sinceDate)
            .order('snapshot_date', { ascending: true }),
        supabase
            .from(myReviewLogsTableName)
            .select('snapshot_date, review_count')
            .eq('store_id', myStoreId)
            .gte('snapshot_date', sinceDate)
            .order('snapshot_date', { ascending: true }),
    ]);

    if (competitorRes.error) throw competitorRes.error;
    if (myRes.error) throw myRes.error;

    const competitorLogs = (competitorRes.data ?? []) as DailyReviewSnapshot[];
    const myLogs = (myRes.data ?? []) as DailyReviewSnapshot[];

    const competitorByDate = new Map(competitorLogs.map((row) => [row.snapshot_date, row.review_count]));
    const myByDate = new Map(myLogs.map((row) => [row.snapshot_date, row.review_count]));

    const allDates = Array.from(new Set([...competitorByDate.keys(), ...myByDate.keys()])).sort();

    let prevMy = 0;
    let prevCompetitor = 0;

    const points: VelocityPoint[] = allDates.map((date) => {
        const myCount = myByDate.get(date) ?? prevMy;
        const competitorCount = competitorByDate.get(date) ?? prevCompetitor;

        const myDailyGrowth = Math.max(0, myCount - prevMy);
        const competitorDailyGrowth = Math.max(0, competitorCount - prevCompetitor);

        prevMy = myCount;
        prevCompetitor = competitorCount;

        return {
            date,
            myReviewCount: myCount,
            competitorReviewCount: competitorCount,
            myDailyGrowth,
            competitorDailyGrowth,
        };
    });

    const myGrowth7d = points.reduce((sum, item) => sum + item.myDailyGrowth, 0);
    const competitorGrowth7d = points.reduce((sum, item) => sum + item.competitorDailyGrowth, 0);

    return {
        competitorStoreId,
        myStoreId,
        points,
        summary: {
            myGrowth7d,
            competitorGrowth7d,
            growthGap: myGrowth7d - competitorGrowth7d,
        },
    };
}
