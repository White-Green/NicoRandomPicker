async function button_pushed() {
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
        // const toint = (s, d) => !!s && !isNaN(Number(s)) ? Number(s) : d;
        // if (toint(parameter.view_count_min, 0) > toint(parameter.view_count_max, 100000000)) {
        //     console.log("error");
        //     document.getElementById("view_counter_max_input").setCustomValidity("最大値は最小値以上である必要があります");
        //     return;
        // } else {
        //     console.log("no_error");
        //     document.getElementById("view_counter_max_input").setCustomValidity("");
        // }
        // let from = Date.parse(parameter.start_time_from);
        // let to = Date.parse(parameter.start_time_to)
        // if (!isNaN(from) && !isNaN(to) && from > to) {
        //     console.log("error");
        //     document.getElementById("start_time_to_input").setCustomValidity("フィルタ期間の終わりは始まり以降である必要があります");
        //     return;
        // } else {
        //     console.log("no_error");
        //     document.getElementById("start_time_to_input").setCustomValidity("");
        // }
        const url = "https://nicorandompickerfunction.azurewebsites.net/api/GetVideosIdByJson";
        // const url = "http://localhost:7071/api/GetVideosIdByJson";
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

function setResult(json) {
    let html = "";
    json.forEach(element => {
        html += "<iframe width=\"312\" height=\"176\" src=\"https://ext.nicovideo.jp/thumb/" + element + "\" scrolling=\"no\" style=\"border:solid 1px #ccc;\" frameborder=\"0\"></iframe>";
    });
    document.getElementById("result").innerHTML = html;
    document.getElementById("hit_count").innerText = "hit " + json.length;
}

document.getElementById("submit_button").addEventListener("click", button_pushed);