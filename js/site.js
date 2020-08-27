async function button_pushed() {
    // console.log("pushed!");
    document.getElementById("result").innerHTML = "";
    document.getElementById("hit_count").innerText = "";
    let tag_name = document.getElementById("tag_name_input").value;
    let video_count = document.getElementById("video_count_input").value;
    fetch("https://nicorandompickerfunction.azurewebsites.net/api/GetVideosId?tag_name=" + encodeURI(tag_name) + "&video_count=" + encodeURI(video_count))
        .then(resp => resp.json())
        .then(json => {
            // console.log(json);
            let html = "";
            json.forEach(element => {
                html += "<iframe width=\"312\" height=\"176\" src=\"https://ext.nicovideo.jp/thumb/" + element + "\" scrolling=\"no\" style=\"border:solid 1px #ccc;\" frameborder=\"0\"></iframe>";
            });
            document.getElementById("result").innerHTML = html;
            document.getElementById("hit_count").innerText = "hit " + json.length;
        });
}

document.getElementById("submit_button").addEventListener("click", button_pushed);