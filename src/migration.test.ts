import {
    create_v2_migration_url,
    MigrationState,
    v2_encode_share_state_endpoint,
} from './migration';

afterEach(() => {
    jest.restoreAllMocks();
});

test('encodes a migration state through the v2 API and adds the redirect marker', async () => {
    const response_text = 'compressed/+ state=';
    const fetch_mock = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(response_text),
    } as Response);
    const state: MigrationState = {
        search: {
            tag: 'ミク テスト',
            uploadedSince: '2024-01-02T03:04',
            uploadedUntil: null,
            viewMin: 100,
            viewMax: null,
            resultCount: 20,
        },
        contentIds: ['sm9', 'so12345678'],
    };

    await expect(create_v2_migration_url(state)).resolves.toBe(
        `https://nicorandompicker.white-green.net/?data=${encodeURIComponent(response_text)}&redirect`,
    );
    expect(fetch_mock).toHaveBeenCalledWith(v2_encode_share_state_endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            search: {
                tag: 'ミク テスト',
                uploadedSince: new Date('2024-01-02T03:04').toISOString(),
                uploadedUntil: null,
                viewMin: 100,
                viewMax: null,
                resultCount: 20,
            },
            contentIds: ['sm9', 'so12345678'],
        }),
    });
});

test('reports a v2 encoder error instead of producing a URL', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('invalid state'),
    } as Response);
    const state: MigrationState = {
        search: {
            tag: '',
            uploadedSince: null,
            uploadedUntil: null,
            viewMin: null,
            viewMax: null,
            resultCount: 10,
        },
        contentIds: [],
    };

    await expect(create_v2_migration_url(state)).rejects.toThrow('invalid state');
});
