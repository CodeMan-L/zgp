// 解决click300ms延迟的问题
FastClick.attach(document.body)

// 获取元素
let musicBtn = document.querySelector(".music_btn"),
    wrapper = document.querySelector(".main_box .wrapper")
progress = document.querySelector(".progress"),
    curTime = document.querySelector(".cur_time"),
    totalTime = document.querySelector(".total_time"),
    progCur = document.querySelector(".pro_bg .prog_cur"),
    myAudio = document.querySelector(".myAudio");
let lyriclist = [],//记录歌词的集合
    prevlyric = null//上一次选中的歌词
    num = 0,//记录歌词切换的次数
    PH = 0;//一行歌词的高度


// 获取数据&&绑定数据
const queryData = function queryData() {
    return new Promise(resolve => {
        let xhr = new XMLHttpRequest;
        xhr.open("get", "./js/fssxdata.json");
        xhr.onreadystatechange = function () {
            let { readyState, status, responseText } = xhr
            if (readyState === 4 && status === 200) {
                let data = JSON.parse(responseText)
                // 请求成功：让实例的状态为成功，值是我们获取的歌词（字符串）

                resolve(data.lyric)
            }
        };
        xhr.send()

    })
}

// 绑定数据
let data=[];
const binding = function binding(lyric) {
    //歌词解析
    let data = [];
    lyric.replace(/(?:\[(\d{2}):(\d{2})\])([^\[\]]+)/g, (_, minutes, seconds,text ) => {
        data.push({
            minutes,
            seconds,
            text,
        })

        })
    // console.log(data);
    // 歌词绑定
    let str = ``;
    data.forEach(item => {
        let { minutes, seconds, text } = item
        str += `<p minutes="${minutes}" seconds="${seconds}">
        ${text}
        </p>`
    })
    wrapper.innerHTML = str;
    lyriclist = Array.from(wrapper.querySelectorAll("p"));
    PH = lyriclist[0].offsetHeight;



}

//歌词滚动&进度条处理
// 定时器设置
const audioPause = function audioPause() {
    myAudio.pause();
    musicBtn.classList.remove("move");
    clearInterval(autoTime);
    autoTime = null;
}
// 处理事件
const format = function format(time) {
    // 变为数字
    time = +time
    let obj = {
        minutes: "00",
        seconds: "00"
    };
    if (time) {
        let m = Math.floor(time / 60),
            s = Math.round(time - m * 60);
        // 补0操作
        obj.minutes = m < 10 ? "0" + m : "" + m;
        obj.seconds = s < 10 ? "0" + s : "" + s;
    }

    return obj
}
const handlelyric = function () {
    let { duration, currentTime } = myAudio;
    a = format(currentTime);
    // 控制歌词选中

    for (let i = 0; i < lyriclist.length; i++) {
        let item = lyriclist[i];
        let minutes = item.getAttribute("minutes"),
            seconds = item.getAttribute("seconds");
        if (minutes === a.minutes && seconds === a.seconds) {
            // 发现一个新匹配的，移除上一个的匹配，让当前这个匹配即可
            if (prevlyric) prevlyric.className = "";
            item.className = "active";
            prevlyric = item;
            num++;
            break
        }

    }

    //控制歌词移动
    if (num >= 4) {
        wrapper.style.top = `${-(num - 4) * PH}px`;
    }
    // 音乐播放结束
    if (currentTime >= duration) {
        wrapper.style.top = 0;
        if (prevlyric) prevlyric.className = "";
        num=0;
        prevlyric=null;
        audioPause();


    };
}

const handleProgress = function handleProgress() {
    // duration 总时长  currenttime 当前时长
    let { duration, currentTime } = myAudio;
    a = format(duration);
    b = format(currentTime);
    if (currentTime >= duration) {
        curTime.innerHTML = `00:00`;
        progCur.style.width = "0%"
        audioPause()
        return
    }
    curTime.innerHTML = `${b.minutes}:${b.seconds}`;
    totalTime.innerHTML = `${a.minutes}:${a.seconds}`;
    progCur.style.width = `${currentTime / duration * 100}%`;



}
$sub.on("palying", handlelyric);
$sub.on("palying", handleProgress);

// 控制播放和暂停的
let timer = autoTime = null;
const handle = function handle() {
    musicBtn.style.opacity = 1
    musicBtn.addEventListener("click", function () {
        
        if (myAudio.paused) {
            // 当前是暂停的,我们让其播放
            myAudio.play()
            musicBtn.classList.add("move")
            // 开启定时器去监听
            if (autoTime == null) {
                $sub.emit("playing")
                autoTime = setInterval(function () {
                    $sub.emit("palying")
                }, 1000);
            }
            return
        }
        //当前是播放的，让其暂停
        audioPause()

    })
};





queryData()
    .then(value => {
        binding(value);
        handle();
    })



