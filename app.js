"use strict";

/*

LOOPA
TikTok-style short-video web application
© Developed by Salah Mustapha

*/

const state = {
currentUser: JSON.parse(localStorage.getItem("loopaUser")) || null,

videos: JSON.parse(localStorage.getItem("loopaVideos")) || [],

following: JSON.parse(localStorage.getItem("loopaFollowing")) || [],

likes: JSON.parse(localStorage.getItem("loopaLikes")) || {},

comments: JSON.parse(localStorage.getItem("loopaComments")) || {},

muted: true,

currentVideoId: null

};

/* =====================================================
SAMPLE CONTENT
===================================================== */

const starterVideos = [
{
id: "starter-1",
username: "loopa",
caption: "Welcome to Loopa 🎬🔥",
music: "Original sound - Loopa",
likes: 1200,
shares: 45,
views: 5400,
video:
"https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
},
{
id: "starter-2",
username: "creator",
caption: "Create. Share. Discover. 🌍",
music: "Original sound",
likes: 845,
shares: 31,
views: 3200,
video:
"https://www.w3schools.com/html/mov_bbb.mp4"
}
];

if (!state.videos.length) {
state.videos = starterVideos;
saveVideos();
}

/* =====================================================
DOM
===================================================== */

const loadingScreen = document.getElementById("loadingScreen");
const app = document.getElementById("app");

const videoFeed = document.getElementById("videoFeed");

const searchButton = document.getElementById("searchButton");
const searchPage = document.getElementById("searchPage");
const closeSearch = document.getElementById("closeSearch");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

const uploadButton = document.getElementById("uploadButton");
const uploadPage = document.getElementById("uploadPage");
const closeUpload = document.getElementById("closeUpload");

const videoInput = document.getElementById("videoInput");
const videoPreview = document.getElementById("videoPreview");
const captionInput = document.getElementById("captionInput");
const publishButton = document.getElementById("publishButton");

const profilePage = document.getElementById("profilePage");
const profileVideos = document.getElementById("profileVideos");

const commentsModal = document.getElementById("commentsModal");
const closeComments = document.getElementById("closeComments");
const commentsList = document.getElementById("commentsList");
const commentInput = document.getElementById("commentInput");
const sendComment = document.getElementById("sendComment");

const loginModal = document.getElementById("loginModal");
const closeLogin = document.getElementById("closeLogin");

const usernameInput = document.getElementById("usernameInput");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");

const loginButton = document.getElementById("loginButton");

const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");

/* =====================================================
STORAGE
===================================================== */

function saveVideos() {
localStorage.setItem(
"loopaVideos",
JSON.stringify(state.videos)
);
}

function saveFollowing() {
localStorage.setItem(
"loopaFollowing",
JSON.stringify(state.following)
);
}

function saveLikes() {
localStorage.setItem(
"loopaLikes",
JSON.stringify(state.likes)
);
}

function saveComments() {
localStorage.setItem(
"loopaComments",
JSON.stringify(state.comments)
);
}

function saveUser() {
localStorage.setItem(
"loopaUser",
JSON.stringify(state.currentUser)
);
}

/* =====================================================
TOAST
===================================================== */

let toastTimer;

function showToast(message) {

toastMessage.textContent = message;

toast.classList.remove("hidden");

clearTimeout(toastTimer);

toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
}, 2200);

}

/* =====================================================
USER
===================================================== */

function requireLogin() {

if (state.currentUser) {
    return true;
}

loginModal.classList.remove("hidden");

return false;

}

function loginUser() {

const username =
    usernameInput.value.trim();

const email =
    emailInput.value.trim();

const password =
    passwordInput.value.trim();


if (!username) {
    showToast("Enter a username");
    return;
}

if (!email || !email.includes("@")) {
    showToast("Enter a valid email");
    return;
}

if (password.length < 6) {
    showToast(
        "Password must be at least 6 characters"
    );
    return;
}


state.currentUser = {
    username: username
        .replace(/\s+/g, "_")
        .toLowerCase(),

    email: email,

    bio: "Welcome to Loopa 🎬",

    followers: 0,

    following: 0,

    likes: 0
};


saveUser();

loginModal.classList.add("hidden");

usernameInput.value = "";
emailInput.value = "";
passwordInput.value = "";

updateProfile();

showToast("Welcome to Loopa 🎉");

}

/* =====================================================
FEED
===================================================== */

function renderFeed() {

videoFeed.innerHTML = "";

state.videos.forEach(video => {

    const card =
        document.createElement("article");

    card.className = "video-card";

    card.dataset.id = video.id;


    const liked =
        state.likes[video.id] === true;

    const isFollowing =
        state.following.includes(video.username);


    card.innerHTML = `

        <video
            src="${escapeHTML(video.video)}"
            loop
            playsinline
            preload="metadata"
            muted>
        </video>

        <div class="video-overlay"></div>

        <div class="play-indicator">
            ▶
        </div>

        <div class="video-info">

            <div class="video-user">

                <div class="avatar">
                    ${getInitial(video.username)}
                </div>

                <span class="username">
                    @${escapeHTML(video.username)}
                </span>

                ${
                    state.currentUser &&
                    state.currentUser.username !== video.username
                    ?
                    `
                    <button
                        class="follow-small ${
                            isFollowing
                            ? "following"
                            : ""
                        }"
                        data-action="follow"
                        data-username="${escapeHTML(video.username)}">

                        ${isFollowing ? "Following" : "Follow"}

                    </button>
                    `
                    : ""
                }

            </div>

            <div class="video-caption">
                ${escapeHTML(video.caption || "")}
            </div>

            <div class="video-music">
                🎵 ${escapeHTML(video.music || "Original sound")}
            </div>

        </div>


        <div class="video-actions">

            <button
                class="action-button ${
                    liked ? "liked" : ""
                }"
                data-action="like">

                <span>♥</span>

                <small>
                    ${formatNumber(
                        video.likes +
                        (liked ? 1 : 0)
                    )}
                </small>

            </button>


            <button
                class="action-button"
                data-action="comment">

                <span>💬</span>

                <small>
                    ${formatNumber(
                        getCommentCount(video.id)
                    )}
                </small>

            </button>


            <button
                class="action-button"
                data-action="share">

                <span>↗</span>

                <small>
                    ${formatNumber(video.shares || 0)}
                </small>

            </button>


            <button
                class="action-button"
                data-action="sound">

                <span>🔇</span>

                <small>Sound</small>

            </button>

        </div>
    `;


    videoFeed.appendChild(card);
});


setupVideoObserver();

setupVideoEvents();

}

/* =====================================================
VIDEO OBSERVER
===================================================== */

let videoObserver;

function setupVideoObserver() {

if (videoObserver) {
    videoObserver.disconnect();
}


videoObserver =
    new IntersectionObserver(
        entries => {

            entries.forEach(entry => {

                const video =
                    entry.target;

                if (
                    entry.isIntersecting &&
                    entry.intersectionRatio > 0.65
                ) {

                    pauseAllExcept(video);

                    video.muted =
                        state.muted;

                    video.play()
                        .catch(() => {});

                } else {

                    video.pause();

                }

            });

        },
        {
            threshold: [0.65]
        }
    );


document
    .querySelectorAll(".video-card video")
    .forEach(video => {

        videoObserver.observe(video);

    });

}

function pauseAllExcept(current) {

document
    .querySelectorAll(".video-card video")
    .forEach(video => {

        if (video !== current) {
            video.pause();
        }

    });

}

/* =====================================================
VIDEO INTERACTION
===================================================== */

function setupVideoEvents() {

document
    .querySelectorAll(".video-card")
    .forEach(card => {

        const video =
            card.querySelector("video");


        video.addEventListener(
            "click",
            () => {

                if (video.paused) {

                    video.play()
                        .catch(() => {});

                    card.classList.remove(
                        "paused"
                    );

                } else {

                    video.pause();

                    card.classList.add(
                        "paused"
                    );

                }

            }
        );


        video.addEventListener(
            "volumechange",
            () => {

                const sound =
                    card.querySelector(
                        '[data-action="sound"] span'
                    );

                if (sound) {

                    sound.textContent =
                        video.muted
                        ? "🔇"
                        : "🔊";

                }

            }
        );

    });

}

/* =====================================================
FEED BUTTONS
===================================================== */

videoFeed.addEventListener(
"click",
event => {

    const button =
        event.target.closest(
            "[data-action]"
        );

    if (!button) return;


    const card =
        button.closest(".video-card");

    if (!card) return;


    const videoId =
        card.dataset.id;

    const action =
        button.dataset.action;


    if (action === "like") {

        toggleLike(videoId);

    }


    if (action === "comment") {

        openComments(videoId);

    }


    if (action === "share") {

        shareVideo(videoId);

    }


    if (action === "sound") {

        toggleSound(card);

    }


    if (action === "follow") {

        const username =
            button.dataset.username;

        toggleFollow(username);

    }

}

);

function toggleLike(videoId) {

if (!requireLogin()) return;


state.likes[videoId] =
    !state.likes[videoId];


saveLikes();

renderFeed();

showToast(
    state.likes[videoId]
    ? "Liked ❤️"
    : "Like removed"
);

}

function toggleFollow(username) {

if (!requireLogin()) return;


const index =
    state.following.indexOf(username);


if (index === -1) {

    state.following.push(username);

    showToast(
        `Following @${username}`
    );

} else {

    state.following.splice(
        index,
        1
    );

    showToast(
        `Unfollowed @${username}`
    );
}


saveFollowing();

updateProfile();

renderFeed();

}

function toggleSound(card) {

const video =
    card.querySelector("video");


state.muted =
    !state.muted;


document
    .querySelectorAll(".video-card video")
    .forEach(v => {

        v.muted =
            state.muted;

    });


video.muted =
    state.muted;


showToast(
    state.muted
    ? "Sound off"
    : "Sound on"
);

}

/* =====================================================
COMMENTS
===================================================== */

function getCommentCount(videoId) {

return (
    state.comments[videoId] || []
).length;

}

function openComments(videoId) {

state.currentVideoId =
    videoId;


renderComments();


commentsModal.classList.remove(
    "hidden"
);

}

function renderComments() {

const list =
    state.comments[
        state.currentVideoId
    ] || [];


commentsList.innerHTML = "";


if (!list.length) {

    commentsList.innerHTML = `
        <div style="
            text-align:center;
            color:#777;
            padding:40px 10px;">
            No comments yet.<br>
            Be the first to comment!
        </div>
    `;

    return;
}


list.forEach(comment => {

    const item =
        document.createElement("div");

    item.className = "comment";


    item.innerHTML = `

        <div class="comment-avatar">
            ${getInitial(comment.username)}
        </div>

        <div class="comment-content">

            <strong>
                @${escapeHTML(comment.username)}
            </strong>

            <p>
                ${escapeHTML(comment.text)}
            </p>

        </div>

    `;


    commentsList.appendChild(item);

});

}

function addComment() {

if (!requireLogin()) return;


const text =
    commentInput.value.trim();


if (!text) return;


if (!state.comments[
    state.currentVideoId
]) {

    state.comments[
        state.currentVideoId
    ] = [];

}


state.comments[
    state.currentVideoId
].push({

    username:
        state.currentUser.username,

    text: text,

    createdAt:
        Date.now()

});


saveComments();

commentInput.value = "";

renderComments();

renderFeed();

showToast("Comment added 💬");

}

/* =====================================================
SHARE
===================================================== */

async function shareVideo(videoId) {

const url =
    window.location.href.split("#")[0] +
    "#video=" +
    encodeURIComponent(videoId);


if (
    navigator.share
) {

    try {

        await navigator.share({
            title: "Watch this on Loopa",
            text: "Check out this video on Loopa!",
            url: url
        });

    } catch (error) {}

} else {

    try {

        await navigator.clipboard.writeText(
            url
        );

        showToast(
            "Video link copied 🔗"
        );

    } catch (error) {

        showToast(
            "Share link ready"
        );

    }

}

}

/* =====================================================
SEARCH
===================================================== */

searchButton.addEventListener(
"click",
() => {

    searchPage.classList.remove(
        "hidden"
    );

    setTimeout(() => {
        searchInput.focus();
    }, 100);

}

);

closeSearch.addEventListener(
"click",
() => {

    searchPage.classList.add(
        "hidden"
    );

    searchInput.value = "";

    searchResults.innerHTML = "";

}

);

searchInput.addEventListener(
"input",
() => {

    const query =
        searchInput.value
            .trim()
            .toLowerCase();


    if (!query) {

        searchResults.innerHTML = "";

        return;
    }


    const users =
        getUniqueUsers()
            .filter(username =>
                username
                    .toLowerCase()
                    .includes(query)
            );


    const matchingVideos =
        state.videos.filter(video =>
            (
                video.username +
                " " +
                video.caption
            )
                .toLowerCase()
                .includes(query)
        );


    searchResults.innerHTML = "";


    users.forEach(username => {

        const result =
            document.createElement("div");

        result.className =
            "search-result";


        result.innerHTML = `

            <div class="avatar">
                ${getInitial(username)}
            </div>

            <div class="search-result-info">

                <strong>
                    @${escapeHTML(username)}
                </strong>

                <span>
                    Creator on Loopa
                </span>

            </div>

        `;


        searchResults.appendChild(result);

    });


    matchingVideos.forEach(video => {

        const result =
            document.createElement("div");

        result.className =
            "search-result";


        result.innerHTML = `

            <div class="avatar">
                ▶
            </div>

            <div class="search-result-info">

                <strong>
                    ${escapeHTML(
                        video.caption ||
                        "Loopa video"
                    )}
                </strong>

                <span>
                    @${escapeHTML(video.username)}
                </span>

            </div>

        `;


        searchResults.appendChild(result);

    });


    if (
        !users.length &&
        !matchingVideos.length
    ) {

        searchResults.innerHTML = `
            <div style="
                text-align:center;
                color:#777;
                padding:40px;">
                No results found
            </div>
        `;

    }

}

);

/* =====================================================
UPLOAD
===================================================== */

uploadButton.addEventListener(
"click",
() => {

    if (!requireLogin()) return;

    uploadPage.classList.remove(
        "hidden"
    );

}

);

closeUpload.addEventListener(
"click",
() => {

    uploadPage.classList.add(
        "hidden"
    );

}

);

let selectedVideoURL = null;

videoInput.addEventListener(
"change",
() => {

    const file =
        videoInput.files[0];


    if (!file) return;


    if (!file.type.startsWith("video/")) {

        showToast(
            "Please select a video"
        );

        return;
    }


    if (selectedVideoURL) {

        URL.revokeObjectURL(
            selectedVideoURL
        );

    }


    selectedVideoURL =
        URL.createObjectURL(file);


    videoPreview.innerHTML = `

        <video
            src="${selectedVideoURL}"
            controls
            playsinline>
        </video>

    `;

}

);

publishButton.addEventListener(
"click",
() => {

    if (!requireLogin()) return;


    if (!selectedVideoURL) {

        showToast(
            "Choose a video first"
        );

        return;
    }


    const caption =
        captionInput.value.trim();


    const newVideo = {

        id:
            "video-" +
            Date.now(),

        username:
            state.currentUser.username,

        caption:
            caption ||
            "My first Loopa video 🎬",

        music:
            "Original sound",

        likes: 0,

        shares: 0,

        views: 0,

        video:
            selectedVideoURL,

        local:
            true

    };


    state.videos.unshift(
        newVideo
    );


    saveVideos();

    renderFeed();


    videoInput.value = "";

    captionInput.value = "";

    videoPreview.innerHTML = "";

    selectedVideoURL = null;


    uploadPage.classList.add(
        "hidden"
    );


    showToast(
        "Video published 🎉"
    );

}

);

/* =====================================================
PROFILE
===================================================== */

function updateProfile() {

if (!state.currentUser) return;


const username =
    document.getElementById(
        "profileUsername"
    );

const bio =
    document.getElementById(
        "profileBio"
    );


username.textContent =
    "@" +
    state.currentUser.username;


bio.textContent =
    state.currentUser.bio ||
    "Welcome to Loopa 🎬";


document.getElementById(
    "followingCount"
).textContent =
    state.following.length;


const followerCount =
    state.videos.filter(
        video =>
            video.username ===
            state.currentUser.username
    ).length;


document.getElementById(
    "followersCount"
).textContent =
    followerCount;


const totalLikes =
    state.videos
        .filter(
            video =>
                video.username ===
                state.currentUser.username
        )
        .reduce(
            (total, video) =>
                total +
                video.likes +
                (
                    state.likes[video.id]
                    ? 1
                    : 0
                ),
            0
        );


document.getElementById(
    "likesCount"
).textContent =
    formatNumber(totalLikes);


renderProfileVideos();

}

function renderProfileVideos() {

profileVideos.innerHTML = "";


if (!state.currentUser) return;


const videos =
    state.videos.filter(
        video =>
            video.username ===
            state.currentUser.username
    );


videos.forEach(video => {

    const item =
        document.createElement("div");

    item.className =
        "profile-video";


    item.innerHTML = `

        <video
            src="${escapeHTML(video.video)}"
            muted
            preload="metadata">
        </video>

    `;


    profileVideos.appendChild(item);

});

}

/* =====================================================
NAVIGATION
===================================================== */

document
.querySelectorAll(".nav-item")
.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            const page =
                button.dataset.page;


            document
                .querySelectorAll(
                    ".nav-item"
                )
                .forEach(item =>
                    item.classList.remove(
                        "active"
                    )
                );


            button.classList.add(
                "active"
            );


            if (page === "home") {

                hidePages();

                videoFeed.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }


            if (page === "discover") {

                searchPage.classList.remove(
                    "hidden"
                );

                setTimeout(() => {
                    searchInput.focus();
                }, 100);

            }


            if (page === "profile") {

                if (!requireLogin()) {
                    return;
                }

                hidePages();

                profilePage.classList.remove(
                    "hidden"
                );

                updateProfile();

            }


            if (page === "notifications") {

                if (!requireLogin()) {
                    return;
                }

                showToast(
                    "No new activity"
                );

            }

        }
    );

});

function hidePages() {

searchPage.classList.add(
    "hidden"
);

uploadPage.classList.add(
    "hidden"
);

profilePage.classList.add(
    "hidden"
);

}

/* =====================================================
COMMENTS EVENTS
===================================================== */

closeComments.addEventListener(
"click",
() => {

    commentsModal.classList.add(
        "hidden"
    );

}

);

commentsModal.addEventListener(
"click",
event => {

    if (
        event.target ===
        commentsModal
    ) {

        commentsModal.classList.add(
            "hidden"
        );

    }

}

);

sendComment.addEventListener(
"click",
addComment
);

commentInput.addEventListener(
"keydown",
event => {

    if (
        event.key === "Enter"
    ) {

        addComment();

    }

}

);

/* =====================================================
LOGIN EVENTS
===================================================== */

loginButton.addEventListener(
"click",
loginUser
);

closeLogin.addEventListener(
"click",
() => {

    loginModal.classList.add(
        "hidden"
    );

}

);

passwordInput.addEventListener(
"keydown",
event => {

    if (
        event.key === "Enter"
    ) {

        loginUser();

    }

}

);

/* =====================================================
HELPERS
===================================================== */

function getInitial(username) {

if (!username) return "L";

return username
    .charAt(0)
    .toUpperCase();

}

function formatNumber(number) {

if (number >= 1000000) {

    return (
        (number / 1000000)
            .toFixed(1)
            .replace(".0", "") +
        "M"
    );

}


if (number >= 1000) {

    return (
        (number / 1000)
            .toFixed(1)
            .replace(".0", "") +
        "K"
    );

}


return String(number);

}

function getUniqueUsers() {

return [
    ...new Set(
        state.videos.map(
            video =>
                video.username
        )
    )
];

}

function escapeHTML(value) {

const div =
    document.createElement("div");

div.textContent =
    String(value ?? "");

return div.innerHTML;

}

/* =====================================================
KEYBOARD / TOUCH
===================================================== */

document.addEventListener(
"keydown",
event => {

    if (
        event.key === "Escape"
    ) {

        searchPage.classList.add(
            "hidden"
        );

        uploadPage.classList.add(
            "hidden"
        );

        commentsModal.classList.add(
            "hidden"
        );

        loginModal.classList.add(
            "hidden"
        );

    }

}

);

/* =====================================================
START APP
===================================================== */

function startApp() {

renderFeed();

if (state.currentUser) {
    updateProfile();
}


setTimeout(() => {

    loadingScreen.classList.add(
        "hidden"
    );

    app.classList.remove(
        "hidden"
    );


    const firstVideo =
        document.querySelector(
            ".video-card video"
        );


    if (firstVideo) {

        firstVideo.muted =
            true;

        firstVideo.play()
            .catch(() => {});

    }

}, 900);

}

startApp();

/*

END OF LOOPA APP
© Developed by Salah Mustapha

*/
