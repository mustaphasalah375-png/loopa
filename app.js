"use strict";

/* =========================
   LOOPA + SUPABASE
   © Developed by Salah Mustapha
========================= */

const SUPABASE_URL = "https://aqmjqkudccnjgntuffzi.supabase.co";
const SUPABASE_KEY = "sb_publishable_A-G1gpUcZy6gNBzyMSNOZA_Pxg4Dvz1";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

/* =========================
   STATE
========================= */

let currentUser = null;
let videos = [];
let currentVideoId = null;
let selectedFile = null;
let muted = true;

/* =========================
   DOM
========================= */

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

/* =========================
   HELPERS
========================= */

let toastTimer;

function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.remove("hidden");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.add("hidden");
    }, 2500);
}

function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
}

function getInitial(name) {
    return name ? name.charAt(0).toUpperCase() : "L";
}

function formatNumber(number) {
    number = Number(number || 0);

    if (number >= 1000000)
        return (number / 1000000).toFixed(1).replace(".0", "") + "M";

    if (number >= 1000)
        return (number / 1000).toFixed(1).replace(".0", "") + "K";

    return String(number);
}

function requireLogin() {
    if (currentUser) return true;

    loginModal.classList.remove("hidden");
    return false;
}

/* =========================
   AUTH
========================= */

async function loginUser() {
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username) {
        showToast("Enter a username");
        return;
    }

    if (!email || !email.includes("@")) {
        showToast("Enter a valid email");
        return;
    }

    if (password.length < 6) {
        showToast("Password must be at least 6 characters");
        return;
    }

    loginButton.disabled = true;
    loginButton.textContent = "Loading...";

    try {
        let result = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username.replace(/\s+/g, "_").toLowerCase(),
                    display_name: username
                }
            }
        });

        if (result.error) {
            const loginResult = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (loginResult.error) {
                throw loginResult.error;
            }

            currentUser = loginResult.data.user;
        } else {
            currentUser = result.data.user;

            if (!currentUser) {
                showToast("Check your email to confirm your account");
                return;
            }
        }

        loginModal.classList.add("hidden");

        usernameInput.value = "";
        emailInput.value = "";
        passwordInput.value = "";

        await loadVideos();
        await updateProfile();

        showToast("Welcome to Loopa 🎉");

    } catch (error) {
        console.error(error);
        showToast(error.message || "Login failed");
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Continue";
    }
}

/* =========================
   LOAD VIDEOS
========================= */

async function loadVideos() {
    const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        showToast("Could not load videos");
        return;
    }

    videos = data || [];
    renderFeed();
}

/* =========================
   VIDEO FEED
========================= */

function renderFeed() {
    videoFeed.innerHTML = "";

    if (!videos.length) {
        videoFeed.innerHTML = `
            <div style="text-align:center;padding:60px 20px;">
                <h2>Welcome to Loopa 🎬</h2>
                <p>No videos yet. Be the first to upload!</p>
            </div>
        `;
        return;
    }

    videos.forEach(video => {
        const card = document.createElement("article");

        card.className = "video-card";
        card.dataset.id = video.id;

        card.innerHTML = `
            <video
                src="${escapeHTML(video.video_url)}"
                loop
                playsinline
                preload="metadata"
                muted>
            </video>

            <div class="video-overlay"></div>

            <div class="play-indicator">▶</div>

            <div class="video-info">
                <div class="video-user">
                    <div class="avatar">
                        ${getInitial(video.user_id)}
                    </div>

                    <span class="username">
                        @creator
                    </span>
                </div>

                <div class="video-caption">
                    ${escapeHTML(video.caption || "")}
                </div>

                <div class="video-music">
                    🎵 Original sound
                </div>
            </div>

            <div class="video-actions">

                <button class="action-button" data-action="like">
                    <span>♥</span>
                    <small>Like</small>
                </button>

                <button class="action-button" data-action="comment">
                    <span>💬</span>
                    <small>Comment</small>
                </button>

                <button class="action-button" data-action="share">
                    <span>↗</span>
                    <small>Share</small>
                </button>

                <button class="action-button" data-action="sound">
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

/* =========================
   AUTO PLAY
========================= */

let videoObserver;

function setupVideoObserver() {
    if (videoObserver) {
        videoObserver.disconnect();
    }

    videoObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const video = entry.target;

            if (entry.isIntersecting && entry.intersectionRatio > 0.65) {
                pauseAllExcept(video);

                video.muted = muted;

                video.play().catch(() => {});
            } else {
                video.pause();
            }
        });
    }, {
        threshold: [0.65]
    });

    document
        .querySelectorAll(".video-card video")
        .forEach(video => videoObserver.observe(video));
}

function pauseAllExcept(current) {
    document.querySelectorAll(".video-card video").forEach(video => {
        if (video !== current) {
            video.pause();
        }
    });
}

/* =========================
   VIDEO BUTTONS
========================= */

function setupVideoEvents() {
    document.querySelectorAll(".video-card").forEach(card => {

        const video = card.querySelector("video");

        video.addEventListener("click", () => {
            if (video.paused) {
                video.play().catch(() => {});
                card.classList.remove("paused");
            } else {
                video.pause();
                card.classList.add("paused");
            }
        });
    });
}

videoFeed.addEventListener("click", event => {

    const button = event.target.closest("[data-action]");

    if (!button) return;

    const card = button.closest(".video-card");

    if (!card) return;

    const videoId
