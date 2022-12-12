import React from 'react';
import './App.css';
import play_button from "./play_button.svg";
import delete_button from "./delete_button.svg";
import share_button from "./share_button.svg";
import loop_button from "./loop_button.svg";
import loop_once_button from "./loop_once_button.svg";
import loop_none_button from "./loop_none_button.svg";
import triangle_right from "./triangle_right.svg";
import triangle_left from "./triangle_left.svg";
import search_button from "./search_button.svg";

const get_video_details_endpoint = "https://nicorandompickerfunction.azurewebsites.net/api/GetVideoDetails";

const form_expand_storage_key = "form_expand";
const player_enabled_storage_key = "player_enabled";
const video_playing_storage_key = "video_playing";
const videos_storage_key = "videos";

interface VideoPlayingData {
    contentId: string,
    tags: string[],
}

function parse_video_playing_data(data: string): VideoPlayingData | null {
    try {
        const object = JSON.parse(data);
        if ("contentId" in object) {
            object.contentId = String(object.contentId);
        } else {
            return null;
        }
        if ("tags" in object && Array.isArray(object.tags)) {
            object.tags = object.tags.map((s: any) => String(s));
        } else {
            return null;
        }
        return object;
    } catch {
        return null;
    }
}

function App() {
    if (window.location.search !== "") {
        const params = new URLSearchParams(window.location.search);
        const data = params.get("data");
        if (data !== null) {
            const search_data = parseData(data);
            if (search_data !== null) {
                const {
                    videos,
                    tag,
                    view_min,
                    view_max,
                    uploaded_since,
                    uploaded_until,
                    result_count,
                } = search_data;
                sessionStorage.setItem(videos_storage_key, JSON.stringify(videos));
                sessionStorage.setItem(tag_storage_key, tag);
                sessionStorage.setItem(view_min_storage_key, view_min !== undefined ? view_min.toString() : "");
                sessionStorage.setItem(view_max_storage_key, view_max !== undefined ? view_max.toString() : "");
                sessionStorage.setItem(uploaded_since_storage_key, uploaded_since);
                sessionStorage.setItem(uploaded_until_storage_key, uploaded_until);
                sessionStorage.setItem(result_count_storage_key, result_count.toString());
            }
        }
        window.location.search = "";
    }

    const [form_expand, set_form_expand] = React.useState<boolean>(sessionStorage.getItem(form_expand_storage_key) !== null);
    const [player_enabled, set_player_enabled] = React.useState<boolean>(sessionStorage.getItem(player_enabled_storage_key) !== null);
    const [videos, set_videos] = React.useState<VideoContent[] | null>(null);
    const [video_playing, set_video_playing] = React.useState<VideoPlayingData | null>(and_then(sessionStorage.getItem(video_playing_storage_key), parse_video_playing_data));
    const [share_expand, set_share_expand] = React.useState<boolean>(false);
    const [share_only_search, set_share_only_search] = React.useState<boolean>(false);

    React.useLayoutEffect(() => {
        if (video_playing !== null && videos !== null) {
            const playing = videos.find(({contentId}) => contentId === video_playing.contentId);
            if (playing !== undefined) {
                playing.div_ref?.current?.scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
            }
        }
    }, [video_playing, videos]);

    React.useEffect(() => {
        const videos_data = sessionStorage.getItem(videos_storage_key);
        if (videos_data === null) return;
        const to_string_list: ((s: string) => string[] | null) = (s) => {
            let obj;
            try {
                obj = JSON.parse(s);
            } catch {
                return null;
            }
            if (!Array.isArray(obj)) return null;
            for (const contentId of obj) {
                if (typeof contentId !== "string") return null;
            }
            return obj as string[];
        };

        const videos_list = to_string_list(videos_data);
        if (videos_list === null) return;

        fetch(get_video_details_endpoint, {
            body: JSON.stringify(videos_list),
            method: "post",
        })
            .then(resp => resp.json())
            .then(detail_map => set_videos(videos_list.map(contentId => {
                return {div_ref: React.createRef(), ...detail_map[contentId]};
            })))
            .catch(console.error);
    }, []);
    React.useEffect(() => {
        if (videos !== null) {
            const videos_data = JSON.stringify(videos.map(({contentId}) => contentId));
            sessionStorage.setItem(videos_storage_key, videos_data);
        }
    }, [videos]);
    React.useEffect(() => {
        if (form_expand) {
            sessionStorage.setItem(form_expand_storage_key, "");
        } else {
            sessionStorage.removeItem(form_expand_storage_key);
        }
    }, [form_expand]);
    React.useEffect(() => {
        if (player_enabled) {
            sessionStorage.setItem(player_enabled_storage_key, "");
        } else {
            sessionStorage.removeItem(player_enabled_storage_key);
        }
    }, [player_enabled]);
    React.useEffect(() => {
        if (video_playing !== null) {
            sessionStorage.setItem(video_playing_storage_key, JSON.stringify(video_playing));
        }
    }, [video_playing]);

    return (
        <div className="App">
            <div className={"body " + (player_enabled && (video_playing !== null) ? "" : "player_disabled ")}>
                <Player
                    video_playing={video_playing}
                    next={() => {
                        if (video_playing === null || videos === null || videos.length === 0) return;
                        const i = videos.findIndex(({contentId}) => contentId === video_playing.contentId);
                        const next_video = i !== -1 ? videos[(i + 1) % videos.length] : videos[0];
                        set_video_playing({contentId: next_video.contentId, tags: next_video.tags});
                    }}
                    prev={() => {
                        if (video_playing === null || videos === null || videos.length === 0) return;
                        const i = videos.findIndex(({contentId}) => contentId === video_playing.contentId);
                        const prev_video = i !== -1 ? videos[(i + videos.length - 1) % videos.length] : videos[videos.length - 1];
                        set_video_playing({contentId: prev_video.contentId, tags: prev_video.tags});
                    }}/>
                <div className="video_link_area">
                    <div>
                        {videos && videos.map((video, i) =>
                            <VideoLink
                                key={video.contentId}
                                ref={video.div_ref}
                                content={video}
                                is_selected={video_playing !== null && video_playing.contentId === video.contentId}
                                on_play={() => {
                                    set_video_playing({contentId: video.contentId, tags: video.tags});
                                    set_player_enabled(true);
                                }}
                                on_delete={() => set_videos([...videos.slice(0, i), ...videos.slice(i + 1)])}/>)}
                        {new Array(10).fill(undefined).map((_, i) => <div key={i}/>)}
                    </div>
                </div>
                <SearchForm
                    expand={form_expand}
                    set_videos={(videos) => {
                        set_videos(videos.map(video => {
                            return {div_ref: React.createRef(), ...video}
                        }));
                        set_form_expand(false);
                    }}/>
                <div className={"share_area " + (share_expand ? "" : "share_area_collapse")}>
                    <label className="share_checkbox_area">
                        検索設定のみ共有
                        <input type="checkbox" value={share_only_search ? "true" : "false"}
                               onChange={(e) => set_share_only_search(e.target.checked)}/>
                    </label>
                    <span className="share_button_area">
                        <button className="btn btn-primary mx-4 my-3" onClick={() => {
                            const url = create_url_by_current_state(share_only_search ? [] : videos);
                            navigator.clipboard.writeText(url)
                                .then(() => set_share_expand(false));
                        }}>リンクURLをコピー
                        </button>
                        <button className="btn btn-primary me-4 my-3" onClick={() => {
                            const url = create_url_by_current_state(share_only_search ? [] : videos);
                            const params = new URLSearchParams({
                                text: `#NicoRandomPicker でランダムに動画を検索しま${share_only_search ? "しょう" : "した"}！`,
                                hashtags: "NicoRandomPickerShare",
                                url,
                            }).toString();
                            window.open("https://twitter.com/intent/tweet?" + params, undefined, "popup,width=500,height=500");
                            set_share_expand(false);
                        }}>リンクをTweet
                        </button>
                    </span>
                </div>
                <header className="header_area">
                    <nav
                        className="navbar navbar-expand-sm navbar-toggleable-sm navbar-light bg-white border-bottom box-shadow mb-0">
                        <div className="container">
                            <a className="navbar-brand header_link_area" href="?">NicoRandomPicker</a>
                            <div className="d-flex header_buttons_area">
                                <button className="btn btn-success mx-1" type="button"
                                        title={`検索結果の共有メニューを${share_expand ? "閉じる" : "開く"}`}
                                        onClick={() => set_share_expand(!share_expand)}>
                                    <img alt="share" src={share_button} height={"auto"} width={"auto"}
                                         style={{height: "1rem"}}/>
                                </button>
                                <button className="btn btn-success mx-1" type="button"
                                        title={`埋め込みプレーヤーを${player_enabled ? "閉じる" : "開く"}`}
                                        onClick={() => set_player_enabled(!player_enabled)}>
                                    <img alt="player expand" className="emoji_like_image" src={triangle_right}/>
                                </button>
                                <button className="btn btn-success mx-1" type="button"
                                        title={`検索メニューを${form_expand ? "閉じる" : "開く"}`}
                                        onClick={() => set_form_expand(!form_expand)}>
                                    <img alt="search expand" className="emoji_like_image" src={search_button}/>
                                </button>
                            </div>
                        </div>
                    </nav>
                </header>
            </div>
        </div>
    );
}

function create_url_by_current_state(videos: VideoContent[] | null) {
    const data = {
        videos: videos !== null ? videos.map(({contentId}) => contentId) : [],
        tag: sessionStorage.getItem(tag_storage_key) || "",
        view_min: filter(map(sessionStorage.getItem(view_min_storage_key), s => Number(s)), (v) => !isNaN(v)) || undefined,
        view_max: filter(map(sessionStorage.getItem(view_max_storage_key), s => Number(s)), (v) => !isNaN(v)) || undefined,
        uploaded_since: sessionStorage.getItem(uploaded_since_storage_key) || "",
        uploaded_until: sessionStorage.getItem(uploaded_until_storage_key) || "",
        result_count: filter(map(sessionStorage.getItem(result_count_storage_key), Number), (v) => !isNaN(v)) || 10,
    };
    return createURL(data);
}

function and_then<T, U>(input: T | null, map: (v: T) => (U | null)): U | null {
    if (input === null) {
        return null;
    } else {
        return map(input);
    }
}

function map<T, U>(input: T | null, map: (v: T) => U): U | null {
    if (input === null) {
        return null;
    } else {
        return map(input);
    }
}

function filter<T>(input: T | null, cond: (v: T) => boolean): T | null {
    if (input !== null && cond(input)) return input;
    return null;
}

type PlayerLoopType = "Loop" | "LoopOne" | "None";

function to_player_loop_type(s: string | null): PlayerLoopType {
    if (s === "LoopOne")
        return "LoopOne";
    else if (s === "None")
        return "None";
    return "Loop";
}

const Player: React.FC<{ video_playing: VideoPlayingData | null, next: () => void, prev: () => void }> =
    ({
         video_playing,
         next,
         prev
     }) => {
        const loop_type_storage_key = "Player:loop_type";

        const [loop_type, set_loop_type] = React.useState<PlayerLoopType>(to_player_loop_type(sessionStorage.getItem(loop_type_storage_key)));
        const [ready_to_play, set_ready_to_play] = React.useState<boolean>(false);
        const player = React.useRef<HTMLIFrameElement>(null);

        React.useEffect(() => {
            sessionStorage.setItem(loop_type_storage_key, loop_type);
        }, [loop_type]);
        const message_callback = React.useCallback((event: MessageEvent<any>) => {
            if (event.origin === 'https://embed.nicovideo.jp') {
                if (event.data.eventName === "loadComplete" && ready_to_play) {
                    set_ready_to_play(false);
                    player.current?.contentWindow?.postMessage({
                        sourceConnectorType: 1,
                        eventName: "play"
                    }, "https://embed.nicovideo.jp");
                }
                if (event.data.eventName === "playerStatusChange" && event.data.data.playerStatus === 4) {
                    switch (loop_type) {
                        case "Loop":
                            set_ready_to_play(true);
                            next();
                            break;
                        case "LoopOne":
                            player.current?.contentWindow?.postMessage({
                                sourceConnectorType: 1,
                                eventName: "play"
                            }, "https://embed.nicovideo.jp");
                            break;
                        case "None":
                            break;
                        default:
                            const _: never = loop_type;
                    }
                }
            }
        }, [loop_type, next, ready_to_play]);
        React.useEffect(() => {
            window.addEventListener("message", message_callback);
            return () => window.removeEventListener("message", message_callback);
        }, [message_callback]);

        return (<div className="player_area">
            <div>
                {video_playing && <iframe
                    ref={player}
                    title="nicovideo_player"
                    src={`https://embed.nicovideo.jp/watch/${video_playing.contentId}?jsapi=1`}
                    width="1920" height="1080" allowFullScreen/>}
                <button className="btn btn-primary next_button"
                        title="次の動画へ"
                        onClick={next}>
                    <img alt="next video" className="emoji_like_image" src={triangle_right}/></button>
                <button className="btn btn-primary prev_button"
                        title="前の動画へ"
                        onClick={prev}>
                    <img alt="next video" className="emoji_like_image" src={triangle_left}/></button>
                <button className="btn btn-primary loop_type_button"
                        title={loop_type === "Loop" ? "全動画ループ中 / 1動画ループへ変更" : loop_type === "LoopOne" ? "1動画ループ中 / 連続再生無しへ変更" : "連続再生無し / 全動画ループへ変更"}
                        onClick={() => {
                            switch (loop_type) {
                                case "Loop":
                                    set_loop_type("LoopOne");
                                    break;
                                case "LoopOne":
                                    set_loop_type("None");
                                    break;
                                case "None":
                                    set_loop_type("Loop");
                                    break;
                                default:
                                    const _: never = loop_type;
                            }
                        }}>
                    {loop_type === "Loop"
                        ? <img alt="video loop state is loop-all-video" src={loop_button}/> : loop_type === "LoopOne"
                            ? <img alt="video loop state is loop-one-video" src={loop_once_button}/>
                            : <img alt="video loop state is no-loop" src={loop_none_button}/>}
                </button>
                <div className="tags">
                    {video_playing && video_playing.tags.map(tag => <button
                        key={tag}
                        onClick={() => navigator.clipboard.writeText(tag)} className="tag">{tag}</button>)}
                </div>
            </div>
        </div>);
    };

const search_endpoint = "https://nicorandompickerfunction.azurewebsites.net/api/SearchVideoWithDetails";

const tag_storage_key = "SearchForm:tag";
const uploaded_since_storage_key = "SearchForm:uploaded_since";
const uploaded_until_storage_key = "SearchForm:uploaded_until";
const view_min_storage_key = "SearchForm:view_min";
const view_max_storage_key = "SearchForm:view_max";
const result_count_storage_key = "SearchForm:result_count";

const SearchForm: React.FC<{ expand: boolean, set_videos: (videos: Omit<VideoContent, "div_ref">[]) => void }> =
    ({
         expand,
         set_videos
     }) => {
        const [tag, set_tag] = React.useState<string>(sessionStorage.getItem(tag_storage_key) || "");
        const tag_ref = React.useRef<HTMLInputElement>(null);
        const [uploaded_since, set_uploaded_since] = React.useState<string>(sessionStorage.getItem(uploaded_since_storage_key) || "");
        const uploaded_since_ref = React.useRef<HTMLInputElement>(null);
        const [uploaded_until, set_uploaded_until] = React.useState<string>(sessionStorage.getItem(uploaded_until_storage_key) || "");
        const uploaded_until_ref = React.useRef<HTMLInputElement>(null);
        const [view_min, set_view_min] = React.useState<string>(sessionStorage.getItem(view_min_storage_key) || "");
        const view_min_ref = React.useRef<HTMLInputElement>(null);
        const [view_max, set_view_max] = React.useState<string>(sessionStorage.getItem(view_max_storage_key) || "");
        const view_max_ref = React.useRef<HTMLInputElement>(null);
        const [result_count, set_result_count] = React.useState<string>(sessionStorage.getItem(result_count_storage_key) || "10");
        const result_count_ref = React.useRef<HTMLInputElement>(null);

        const [searching, set_searching] = React.useState<boolean>(false);

        const [error, set_error] = React.useState<string | null>(null);

        React.useEffect(() => sessionStorage.setItem(tag_storage_key, tag), [tag]);
        React.useEffect(() => sessionStorage.setItem(uploaded_since_storage_key, uploaded_since), [uploaded_since]);
        React.useEffect(() => sessionStorage.setItem(uploaded_until_storage_key, uploaded_until), [uploaded_until]);
        React.useEffect(() => sessionStorage.setItem(view_min_storage_key, view_min), [view_min]);
        React.useEffect(() => sessionStorage.setItem(view_max_storage_key, view_max), [view_max]);
        React.useEffect(() => sessionStorage.setItem(result_count_storage_key, result_count), [result_count]);

        return (<div className={"text-center form_main container " + (expand ? "" : "form_collapse ")}>
            <div className="form_area">
                <div className="form-group my-3">
                    <label htmlFor="tag_name_input">タグ</label>
                    <input ref={tag_ref}
                           type="text" className="form-control" id="tag_name_input" name="tag_name"
                           value={tag}
                           onChange={(e) => set_tag(e.target.value)}
                           placeholder="タグを空白区切りで入力してください" required/>
                </div>
                <div className="form-group my-3">
                    <label htmlFor="start_time_input">アップロード日時フィルタ</label>
                    <div className="row" id="start_time_input">
                        <div className="col form-group">
                            <label htmlFor="start_time_from_input">ここから</label>
                            <input ref={uploaded_since_ref}
                                   type="datetime-local"
                                   className="form-control"
                                   id="start_time_from_input"
                                   value={uploaded_since}
                                   onChange={(e) => set_uploaded_since(e.target.value)}
                                   name="start_time_from"/>
                        </div>
                        <div className="col form-group">
                            <label htmlFor="start_time_to_input">ここまで</label>
                            <input ref={uploaded_until_ref}
                                   type="datetime-local"
                                   className="form-control"
                                   id="start_time_to_input"
                                   value={uploaded_until}
                                   onChange={(e) => set_uploaded_until(e.target.value)}
                                   name="start_time_to"/>
                        </div>
                    </div>
                </div>
                <div className="form-group my-3">
                    <label htmlFor="view_counter_input">再生数フィルタ</label>
                    <div className="row" id="view_counter_input">
                        <div className="col form-group">
                            <label htmlFor="view_counter_min_input">これ以上</label>
                            <input ref={view_min_ref}
                                   type="number"
                                   className="form-control"
                                   id="view_counter_min_input"
                                   value={view_min}
                                   onChange={(e) => set_view_min(e.target.value)}
                                   placeholder="0以上"
                                   name="view_counter_min" min="0" max="100000000"/>
                        </div>
                        <div className="col form-group">
                            <label htmlFor="view_counter_max_input">これ以下</label>
                            <input ref={view_max_ref}
                                   type="number"
                                   className="form-control"
                                   id="view_counter_max_input"
                                   value={view_max}
                                   onChange={(e) => set_view_max(e.target.value)}
                                   placeholder="100,000,000以下" name="view_counter_max" min="0"
                                   max="100000000"/>
                        </div>
                    </div>
                </div>
                <div className="form-group my-3">
                    <label htmlFor="video_count_input">検索件数上限</label>
                    <input ref={result_count_ref}
                           type="number"
                           className="form-control"
                           id="video_count_input"
                           name="video_count"
                           value={result_count}
                           onChange={(e) => set_result_count(e.target.value)}
                           placeholder="0~100" max="100" min="1" required/>
                </div>
                <div className="row justify-content-center my-3">
                    <div className="col-3">
                        {error && ("Error: " + error)}
                    </div>
                    <div className="col-6">
                        <button id="submit_button" className="btn btn-primary" data-toggle="tooltip"
                                onClick={() => {
                                    const valid = [tag_ref, uploaded_since_ref, uploaded_until_ref, view_min_ref, view_max_ref, result_count_ref]
                                        .map(ref => ref.current?.reportValidity())
                                        .reduce((a, b) => a && b);
                                    if (!valid) return;
                                    set_searching(true);
                                    const params = {
                                        tag_name: tag,
                                        video_count: result_count,
                                        view_count_min: view_min,
                                        view_count_max: view_max,
                                        start_time_from: uploaded_since,
                                        start_time_to: uploaded_until,
                                    };
                                    set_error(null);
                                    fetch(search_endpoint + "?param=" + encodeURIComponent(JSON.stringify(params)))
                                        .then(resp => resp.json())
                                        .then(set_videos)
                                        .catch(error => {
                                            console.log(error);
                                            set_error(error);
                                        })
                                        .finally(() => {
                                            set_searching(false);
                                        });
                                }}
                                disabled={searching}
                                title="本日朝5時までに投稿された動画が対象です。">{searching ? "検索中" : "探す"}
                        </button>
                    </div>
                    <div className="col-3"></div>
                </div>
            </div>
        </div>);
    };

interface VideoContent {
    contentId: string,
    title: string,
    viewCounter: string,
    commentCounter: string,
    mylistCounter: string,
    likeCounter: string,
    lengthSeconds: string,
    thumbnailUrl: string,
    tags: string[],
    div_ref: React.RefObject<HTMLDivElement>,
}

const unescapeHTML = (text: string) => {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.textContent;
};

const VideoLink = React.forwardRef<HTMLDivElement, { content: VideoContent, is_selected: boolean, on_play: () => void, on_delete: () => void }>(
    ({
         content,
         is_selected,
         on_play,
         on_delete
     }, ref) => {
        const {
            contentId,
            title,
            thumbnailUrl,
            viewCounter,
            commentCounter,
            mylistCounter,
            likeCounter,
            lengthSeconds,
        } = content;
        return (
            <div ref={ref}
                 className={"video_link_component " + (is_selected ? "video_link_component_selected " : "")}>
                <img alt={`thumbnail of ${contentId}`} src={`${thumbnailUrl}.M`} loading="lazy"
                     onError={(e) => (e.target as HTMLImageElement).src = thumbnailUrl}/>
                <div className="video_link_content">
                    <div className="video_link_title_area">
                        <button className="video_link_delete_area" onClick={on_delete}>
                            <img alt={`delete ${contentId} from search result`} src={delete_button} width={30}
                                 height={30}/>
                        </button>
                        <a href={`https://nico.ms/${contentId}`}
                           target="_blank"
                           rel="noreferrer noopener">
                            {unescapeHTML(title)}
                        </a>
                    </div>
                    <div className="video_link_detail_area">
                        <div className="video_link_detail">
                            <span>
                        {"▶️" + Number(viewCounter).toLocaleString()}
                            </span>
                            <span>
                        {"💬" + Number(commentCounter).toLocaleString()}
                            </span>
                            <span>
                        {"📁" + Number(mylistCounter).toLocaleString()}
                            </span>
                            <span>
                        {"♥️" + Number(likeCounter).toLocaleString()}
                            </span>
                        </div>
                        <div className="video_link_duration">
                            {Math.floor(Number(lengthSeconds) / 60) + ":" + (Number(lengthSeconds) % 60).toString().padStart(2, '0')}
                        </div>
                    </div>
                    <button className="video_link_play_logo" onClick={on_play}>
                        <img alt={`play ${contentId}`} src={play_button}/>
                    </button>
                </div>
            </div>);
    });

function decimal_to_62(value: number) {
    if (value === 0) return "0";
    let result = "";
    while (value > 0) {
        let digit = value % 62;
        value = parseInt(String(value / 62));
        if (0 <= digit && digit <= 9) result = String.fromCharCode("0".charCodeAt(0) + digit) + result;
        if (10 <= digit && digit <= 35) result = String.fromCharCode("a".charCodeAt(0) + digit - 10) + result;
        if (36 <= digit && digit <= 61) result = String.fromCharCode("A".charCodeAt(0) + digit - 36) + result;
    }
    return result;
}

function decimal_from_62(value: string) {
    if (value === "") return null;
    let result = 0;
    for (let i = 0; i < value.length; i++) {
        result *= 62;
        let c = value.charCodeAt(i);
        if ("0".charCodeAt(0) <= c && c <= "9".charCodeAt(0)) result += c - "0".charCodeAt(0);
        if ("a".charCodeAt(0) <= c && c <= "z".charCodeAt(0)) result += 10 + c - "a".charCodeAt(0);
        if ("A".charCodeAt(0) <= c && c <= "Z".charCodeAt(0)) result += 36 + c - "A".charCodeAt(0);
    }
    return result;
}

function str_to_base64(str: string) {
    // @ts-ignore Uint8Array is like number[]
    let utf8str = String.fromCharCode(...new TextEncoder().encode(str));
    return window.btoa(utf8str);
}

function str_from_base64(data: string) {
    try {
        const decoded_utf8str = window.atob(data);
        // @ts-ignore string is like string[]
        const decoded_array = new Uint8Array(Array.prototype.map.call(decoded_utf8str, c => c.charCodeAt(0)));
        return new TextDecoder().decode(decoded_array);
    } catch {
        return null
    }
}

function compress_videos(videos: string[]) {
    let result = [];
    for (const video of videos) {
        let len = 0;
        while (video.charCodeAt(len) < "0".charCodeAt(0) || "9".charCodeAt(0) < video.charCodeAt(len)) len++;
        result.push(video.substring(0, len) + (len === 2 ? "" : "_") + decimal_to_62(Number(video.substring(len))));
    }
    return result.join("-");
}

function decompress_videos(str: string) {
    let video_list = str.split("-");
    let result = [];
    for (const video of video_list) {
        if (video) {
            if (video.includes("_")) {
                let sp = video.split("_");
                result.push(sp[0] + decimal_from_62(sp[1]));
            } else {
                result.push(video.substring(0, 2) + decimal_from_62(video.substring(2)));
            }
        }
    }
    return result;
}

function compress_datetime(datetime: string) {
    const regex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
    if (!regex.test(datetime)) return "";
    let i = datetime.substring(0, 4)
        + datetime.substring(5, 7)
        + datetime.substring(8, 10)
        + datetime.substring(11, 13)
        + datetime.substring(14);
    if (isNaN(Number(i))) return "";
    return decimal_to_62(Number(i));
}

function decompress_datetime(data: string) {
    let decimal = decimal_from_62(data);
    if (!decimal) return "";
    let i = decimal.toString();
    if (i.length > 12) return "";
    while (i.length < 12) i = "0" + i;
    return i.substring(0, 4) + "-"
        + i.substring(4, 6) + "-"
        + i.substring(6, 8) + "T"
        + i.substring(8, 10) + ":"
        + i.substring(10);
}

interface ShareData {
    videos: string[],
    tag: string,
    view_min?: number,
    view_max?: number,
    uploaded_since: string,
    uploaded_until: string,
    result_count: number,
}

function createURL(data: ShareData) {
    let d = {
        version: 2,
        body: compress_videos(data.videos),
        params:
            str_to_base64(data.tag)
            + "_" + decimal_to_62(data.result_count)
            + "_" + (data.view_min !== undefined ? decimal_to_62(data.view_min) : "")
            + "_" + (data.view_max !== undefined ? decimal_to_62(data.view_max) : "")
            + "_" + compress_datetime(data.uploaded_since)
            + "_" + compress_datetime(data.uploaded_until)
    };
    return window.location.origin + window.location.pathname + "?data=" + encodeURIComponent(JSON.stringify(d));
}

function parseData(data: string): ShareData | null {
    let object: { version: Exclude<number, 1 | 2> | undefined, body: undefined, params: undefined } |
        {
            version: 1,
            body?: string[],
            params?: {
                tag_name?: string,
                video_count?: string,
                view_counter_min?: string,
                view_counter_max?: string,
                start_time_from?: string,
                start_time_to?: string
            }
        }
        | { version: 2, body?: string, params?: string };
    try {
        object = JSON.parse(data);
    } catch {
        return null;
    }
    if (object.version === undefined) return null;
    let result: ShareData = {
        videos: [],
        tag: "",
        view_min: undefined,
        view_max: undefined,
        uploaded_since: "",
        uploaded_until: "",
        result_count: 10,
    };
    switch (object.version) {
        case 1:
            if (object.body !== undefined && Array.isArray(object.body)) {
                const pattern = new RegExp(/\D{2}\d+/);
                result.videos = object.body.filter(s => pattern.test(String(s))).slice(0, 100);
            }
            if (object.params !== undefined) {
                const params = object.params;
                if (params.tag_name !== undefined) result.tag = params.tag_name;
                if (params.video_count !== undefined && !isNaN(Number(params.video_count))) result.result_count = Number(params.video_count);
                if (params.view_counter_min !== undefined && !isNaN(Number(params.view_counter_min))) result.view_min = Number(params.view_counter_min);
                if (params.view_counter_max !== undefined && !isNaN(Number(params.view_counter_max))) result.view_max = Number(params.view_counter_max);
                if (params.start_time_from !== undefined) result.uploaded_since = params.start_time_from;
                if (params.start_time_to !== undefined) result.uploaded_until = params.start_time_to;
            }
            return result;
        case 2:
            if (object.body !== undefined) {
                result.videos = decompress_videos(object.body);
            }
            if (object.params !== undefined) {
                const p = object.params.split("_");
                if (p.length >= 1) result.tag = str_from_base64(p[0]) || "";
                if (p.length >= 2) result.result_count = decimal_from_62(p[1]) || 10;
                if (p.length >= 3) result.view_min = decimal_from_62(p[2]) || undefined;
                if (p.length >= 4) result.view_max = decimal_from_62(p[3]) || undefined;
                if (p.length >= 5) result.uploaded_since = decompress_datetime(p[4]);
                if (p.length >= 6) result.uploaded_until = decompress_datetime(p[5]);
            }
            return result;
        default:
            return null;
    }
}

export default App;
