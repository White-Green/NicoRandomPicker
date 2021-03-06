let videos = [];

async function button_pushed() {
    const url = "https://nicorandompickerfunction.azurewebsites.net/api/GetVideosIdByJson";
    await request(url);
}

async function button_pushed_snapshot() {
    const url = "https://nicorandompickerfunction.azurewebsites.net/api/GetVideosIdSnapshot";
    await request(url);
}

async function request(url) {
    // console.log("pushed!");
    try {
        let b = true;
        document.querySelectorAll("input").forEach(element => {
            b = element.reportValidity() && b;
        });
        if (!b) return;
        document.getElementById("submit_button").disabled = true;
        document.getElementById("hit_count").innerText = "検索中";
        document.getElementById("result").innerHTML = "";
        let parameter = {
            tag_name: document.getElementById("tag_name_input").value,
            video_count: document.getElementById("video_count_input").value,
            view_count_min: document.getElementById("view_counter_min_input").value,
            view_count_max: document.getElementById("view_counter_max_input").value,
            start_time_from: document.getElementById("start_time_from_input").value,
            start_time_to: document.getElementById("start_time_to_input").value,
        };
        // console.log(url + "?param=" + encodeURIComponent(JSON.stringify(parameter)));
        fetch(url + "?param=" + encodeURIComponent(JSON.stringify(parameter)))
            .then(resp => resp.json())
            .then(setResult)
            .catch(error => {
                console.log(error);
                document.getElementById("hit_count").innerText = "ERROR - " + error;
            })
            .finally(() => {
                // console.log("finally");
                document.getElementById("submit_button").disabled = false;
            });
    } catch (error) {
        console.log(error);
        document.getElementById("submit_button").disabled = false;
        document.getElementById("hit_count").innerText = "ERROR - " + error;
    }
}

function decimal_to_62(value) {
    if (value === 0) return "0";
    let result = "";
    while (value > 0) {
        let digit = value % 62;
        value = parseInt(value / 62);
        if (0 <= digit && digit <= 9) result = String.fromCharCode("0".charCodeAt() + digit) + result;
        if (10 <= digit && digit <= 35) result = String.fromCharCode("a".charCodeAt() + digit - 10) + result;
        if (36 <= digit && digit <= 61) result = String.fromCharCode("A".charCodeAt() + digit - 36) + result;
    }
    return result;
}

function decimal_from_62(value) {
    if (value === "") return null;
    let result = 0;
    for (let i = 0; i < value.length; i++) {
        result *= 62;
        let c = value.charCodeAt(i);
        if ("0".charCodeAt() <= c && c <= "9".charCodeAt()) result += c - "0".charCodeAt();
        if ("a".charCodeAt() <= c && c <= "z".charCodeAt()) result += 10 + c - "a".charCodeAt();
        if ("A".charCodeAt() <= c && c <= "Z".charCodeAt()) result += 36 + c - "A".charCodeAt();
    }
    return result;
}

function str_to_base64(str) {
    let utf8str = String.fromCharCode.apply(null, new TextEncoder().encode(str));
    return btoa(utf8str);
}

function str_from_base64(data) {
    const decoded_utf8str = atob(data);
    const decoded_array = new Uint8Array(Array.prototype.map.call(decoded_utf8str, c => c.charCodeAt()));
    return new TextDecoder().decode(decoded_array);
}

function compress_videos(videos) {
    let result = [];
    for (const video of videos) {
        let len = 0;
        while (video.charCodeAt(len) < "0".charCodeAt() || "9".charCodeAt() < video.charCodeAt(len)) len++;
        result.push(video.substring(0, len) + (len === 2 ? "" : "_") + decimal_to_62(video.substring(len)));
    }
    return result.join("-");
}

function decompress_videos(str) {
    let video_list = str.split("-");
    let result = [];
    for (const video of video_list) {
        if (video.includes("_")) {
            let sp = video.split("_");
            result.push(sp[0] + decimal_from_62(sp[1]));
        } else {
            result.push(video.substring(0, 2) + decimal_from_62(video.substring(2)));
        }
    }
    return result;
}

function compress_datetime(datetime) {
    const regex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.compile();
    if (!regex.test(datetime)) return "";
    let i = datetime.substring(0, 4)
        + datetime.substring(5, 7)
        + datetime.substring(8, 10)
        + datetime.substring(11, 13)
        + datetime.substring(14);
    if (isNaN(Number(i))) return "";
    return decimal_to_62(i);
}

function decompress_datetime(data) {
    let i = decimal_from_62(data).toString();
    if (i.length > 12) return "";
    while (i.length < 12) i = "0" + i;
    return i.substring(0, 4) + "-"
        + i.substring(4, 6) + "-"
        + i.substring(6, 8) + "T"
        + i.substring(8, 10) + ":"
        + i.substring(10);
}

function createURL() {
    let data = {
        version: 2,
        body: compress_videos(videos),
        params:
            str_to_base64(document.getElementById("tag_name_input").value)
            + "_" + decimal_to_62(document.getElementById("video_count_input").value)
            + "_" + decimal_to_62(document.getElementById("view_counter_min_input").value)
            + "_" + decimal_to_62(document.getElementById("view_counter_max_input").value)
            + "_" + compress_datetime(document.getElementById("start_time_from_input").value)
            + "_" + compress_datetime(document.getElementById("start_time_to_input").value)
    };
    // console.log(data);
    return location.origin + location.pathname + "?data=" + encodeURIComponent(JSON.stringify(data));
}

function setResult(list) {
    videos = list;
    let html = "";
    list.forEach(element => {
        html += "<iframe width=\"312\" height=\"176\" src=\"https://ext.nicovideo.jp/thumb/" + element + "\" scrolling=\"no\" style=\"border:solid 1px #ccc;\" frameborder=\"0\"></iframe>";
    });
    document.getElementById("result").innerHTML = html;
    document.getElementById("hit_count").innerText = "hit " + list.length;
    make_tweet_button();
}

function jsonTryParse(val) {
    try {
        return JSON.parse(val);
    } catch {
        return null;
    }
}

let promise = Promise.resolve(true);

function make_tweet_button() {
    promise = promise.then(() => {
        return new Promise((resolve) => {
            let area = document.getElementById("twitter_share_button_area");
            area.innerHTML = "";
            twttr.widgets.createShareButton(
                createURL(),
                area,
                {
                    lang: "ja",
                    count: 'none',
                    size: "large",
                    text: '#NicoRandomPicker でランダムに動画を検索しました！',
                    hashtags: "NicoRandomPickerShare"
                })
                .then(() => {
                    resolve();
                });
        });
    });
}

function copy_url() {
    var body = document.body;
    if (!body) return false;

    var text_area = document.createElement("textarea");
    text_area.value = createURL();
    body.appendChild(text_area);
    text_area.select();
    var result = document.execCommand("copy");
    body.removeChild(text_area);
    return result;
}

window.addEventListener("load", () => {
    document.getElementById("submit_button").addEventListener("click", button_pushed);
    document.getElementById("submit_button_snapshot").addEventListener("click", button_pushed_snapshot);
    document.getElementById("copy_url_button").addEventListener("click", copy_url);
    document.querySelectorAll("input").forEach(e => e.addEventListener("change", make_tweet_button));
    make_tweet_button();
    // console.log("load");
    let params = new URLSearchParams(location.search);
    let data = jsonTryParse(params.get("data"));
    // console.log(data);
    if (!data) {
        // console.log("data is undefined"); 
        return;
    }
    if (data.version !== undefined) {
        if (data.version === 1) {
            if (data.body === undefined) {
                // console.log("data.body is undefined");
                return;
            }
            let body = data.body;
            if (!Array.isArray(body)) {
                // console.log("data.body is not Array");
                return;
            }
            let correct = true;
            let regex = /\D{2}\d+/.compile();
            for (const item in body) {
                correct &= regex.test(item);
            }
            if (correct) setResult(body);
            // else console.log("body is not correct");

            if (data.params !== undefined) {
                let params = data.params;
                document.getElementById("tag_name_input").value = params.tag_name;
                document.getElementById("video_count_input").value = params.video_count;
                document.getElementById("view_counter_min_input").value = params.view_counter_min;
                document.getElementById("view_counter_max_input").value = params.view_counter_max;
                document.getElementById("start_time_from_input").value = params.start_time_from;
                document.getElementById("start_time_to_input").value = params.start_time_to;
                make_tweet_button();
            }
        } else if (data.version === 2) {
            if (data.body !== undefined) {
                let body = data.body;
                setResult(decompress_videos(body));
            }
            if (data.params !== undefined) {
                let params = data.params;
                let p = params.split("_");
                document.getElementById("tag_name_input").value = str_from_base64(p[0]);
                document.getElementById("video_count_input").value = decimal_from_62(p[1]);
                document.getElementById("view_counter_min_input").value = decimal_from_62(p[2]);
                document.getElementById("view_counter_max_input").value = decimal_from_62(p[3]);
                document.getElementById("start_time_from_input").value = decompress_datetime(p[4]);
                document.getElementById("start_time_to_input").value = decompress_datetime(p[5]);
                make_tweet_button();
            }
        }
    }
});