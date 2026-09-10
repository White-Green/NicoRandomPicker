import React from 'react';
import {render, waitFor} from '@testing-library/react';
import App from './App';

const v2_encode_share_state_endpoint = 'https://nicorandompicker.white-green.net/api/encode_share_state';

afterEach(() => {
    jest.restoreAllMocks();
    sessionStorage.clear();
});

test('logs a v2 migration URL with the persisted legacy state after mounting', async () => {
    sessionStorage.setItem('SearchForm:tag', '初音ミク VOCALOID');
    sessionStorage.setItem('SearchForm:uploaded_since', '2024-01-02T03:04');
    sessionStorage.setItem('SearchForm:uploaded_until', '2025-06-07T08:09');
    sessionStorage.setItem('SearchForm:view_min', '100');
    sessionStorage.setItem('SearchForm:view_max', '20000');
    sessionStorage.setItem('SearchForm:result_count', '25');
    sessionStorage.setItem('videos', JSON.stringify(['sm9', 'so12345678']));

    const fetch_mock = jest.spyOn(global, 'fetch').mockImplementation((input) => {
        if (input === v2_encode_share_state_endpoint) {
            return Promise.resolve({
                ok: true,
                text: () => Promise.resolve('encoded/share+state'),
            } as Response);
        }
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                sm9: {contentId: 'sm9'},
                so12345678: {contentId: 'so12345678'},
            }),
        } as Response);
    });
    const console_log = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    render(<App/>);

    await waitFor(() => expect(console_log).toHaveBeenCalledWith(
        'NicoRandomPicker v2 migration URL:',
        'https://nicorandompicker.white-green.net/?data=encoded%2Fshare%2Bstate&redirect',
    ));

    const encode_call = fetch_mock.mock.calls.find(([input]) => input === v2_encode_share_state_endpoint);
    expect(encode_call).toBeDefined();
    expect(JSON.parse((encode_call?.[1] as RequestInit).body as string)).toEqual({
        search: {
            tag: '初音ミク VOCALOID',
            uploadedSince: new Date('2024-01-02T03:04').toISOString(),
            uploadedUntil: new Date('2025-06-07T08:09').toISOString(),
            viewMin: 100,
            viewMax: 20000,
            resultCount: 25,
        },
        contentIds: ['sm9', 'so12345678'],
    });
});
