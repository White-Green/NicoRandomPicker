export interface MigrationSearchState {
    tag: string,
    uploadedSince: string | null,
    uploadedUntil: string | null,
    viewMin: number | null,
    viewMax: number | null,
    resultCount: number,
}

export interface MigrationState {
    search: MigrationSearchState,
    contentIds: string[],
}

export const v2_app_url = "https://nicorandompicker.white-green.net/";
export const v2_encode_share_state_endpoint = v2_app_url + "api/encode_share_state";

function local_datetime_to_rfc3339(value: string | null): string | null {
    if (value === null || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function create_v2_migration_url(state: MigrationState): Promise<string> {
    const response = await fetch(v2_encode_share_state_endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            search: {
                tag: state.search.tag,
                uploadedSince: local_datetime_to_rfc3339(state.search.uploadedSince),
                uploadedUntil: local_datetime_to_rfc3339(state.search.uploadedUntil),
                viewMin: state.search.viewMin,
                viewMax: state.search.viewMax,
                resultCount: state.search.resultCount,
            },
            contentIds: state.contentIds,
        }),
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Failed to encode state for v2: ${response.status}`);
    }

    const data = await response.text();
    return `${v2_app_url}?data=${encodeURIComponent(data)}&redirect`;
}
