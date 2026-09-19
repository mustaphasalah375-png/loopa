"use strict";
/*
LOOPA TikTok-style short-video web application © Developed by Salah Mustapha
*/
const state = { currentUser: JSON.parse(localStorage.getItem("loopaUser")) || null,
videos: JSON.parse(localStorage.getItem("loopaVideos")) || [], following: JSON.parse(localStorage.getItem("loopaFollowing")) || [], likes: JSON.parse(localStorage.getItem("loopaLikes")) || {}, comments: JSON.parse(localStorage.getItem("loopaComments")) || {}, muted: true, currentVideoId: null 
};
/* ===================================================== SAMPLE CONTENT ===================================================== */
const starterVideos = [ { id: "starter-1", username: "loopa", caption: "Welcome to Loopa 🎬🔥", music: "Original sound - Loopa", likes: 1200, shares: 45, views: 5400, video: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" }, { id: "starter-2", username: "creator", caption: "Create. Share. Discover. 🌍", music: "Original sound", likes: 845, shares: 31, views: 3200, video: "https://www.w3schools.com/html/mov_bbb.mp4" } ];
if (!state.videos.length) { state.videos = starterVideos; saveVideos(); }
/* ===================================================== DOM ===================================================== */
const loadingScreen = document.getElementById("loadingScreen"); const app = document.getElementById("app");
const videoFeed = document.getElementById("videoFeed");
const searchButton = document.getElementById("searchButton"); const searchPage = document.getElementById("searchPage"); const closeSearch = document.getElementById("closeSearch"); const searchInput = document.getElementById("searchInput"); const searchResults = document.getElementById("searchResults");
const uploadButton = document.getElementById("uploadButton"); const uploadPage = document.getElementById("uploadPage"); const closeUpload = document.getElementById("closeUpload");
const videoInput = document.getElementById("videoInput"); const videoPreview = document.getElementById("videoPreview"); const captionInput = document.getElementById("captionInput"); const publishButton = document.getElementById("publishButton");
const profilePage = document.getElementById("profilePage"); const profileVideos = document.getElementById("profileVideos");
const commentsModal = document.getElementById("commentsModal"); const closeComments = document.getElementById("closeComments"); const commentsList = document.getElementById("commentsList"); const commentInput = document.getElementById("commentInput"); const sendComment = document.getElementById("sendComment");
const loginModal = document.getElementById("loginModal"); const closeLogin = document.getElementById("closeLogin");
const usernameInput = document.getElementById("usernameInput"); const emailInput = document.getElementById("emailInput"); const passwordInput = document.getElementById("passwordInput");
const loginButton = document.getElementById("loginButton");
const toast = document.getElementById("toast"); const toastMessage = document.getElementById("toastMessage");
/* ===================================================== STORAGE ===================================================== */
function saveVideos() { localStorage.setItem( "loopaVideos", JSON.stringify(state.videos) ); }
function saveFollowing() { localStorage.setItem( "loopaFollowing", JSON.stringify(state.following) ); }
function saveLikes() { localStorage.setItem( "loopaLikes", JSON.stringify(state.likes) ); }
function saveComments() { localStorage.setItem( "loopaComments", JSON.stringify(state.comments) ); }
function saveUser() { localStorage.setItem( "loopaUser", JSON.stringify(state.currentUser) ); }
/* ===================================================== TOAST ===================================================== */
let toastTimer;
function showToast(message) {
toastMessage.textContent = message; toast.classList.remove("hidden"); clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.classList.add("hidden"); }, 2200); 
}
/* ===================================================== USER ===================================================== */
function requireLogin() {
if (state.currentUser) { return true; } loginModal.classList.remove("hidden"); return false; 
}
function loginUser() {
const username = usernameInput.value.trim(); const email = emailInput.value.trim(); const password = passwordInput.value.trim(); if (!username) { showToast("Enter a username"); return; } if (!email || !email.includes("@")) { showToast("Enter a valid email"); return; } if (password.length < 6) { showToast( "Password must be at least 6 characters" ); return; } state.currentUser = { username: username .replace(/\s+/g, "_") .toLowerCase(), email: email, bio: "Welcome to Loopa 🎬", followers: 0, following: 0, likes: 0 }; saveUser(); loginModal.classList.add("hidden"); usernameInput.value = ""; emailInput.value = ""; passwordInput.value = ""; updateProfile(); showToast("Welcome to Loopa 🎉"); 
}
/* ===================================================== FEED ===================================================== */
function renderFeed() {
videoFeed.innerHTML = ""; state.videos.forEach(video => { const card = document.createElement("article"); card.className = "video-card"; card.dataset.id = video.id; const liked = state.likes[video.id] === true; const isFollowing = state.following.includes(video.username); card.innerHTML = ` <video src="${escapeHTML(video.video)}" loop playsinline preload="metadata" muted> </video> <div class="video-overlay"></div> <div class="play-indicator"> ▶ </div> <div class="video-info"> <div class="video-user"> <div class="avatar"> ${getInitial(video.username)} </div> <span class="username"> @${escapeHTML(video.username)} </span> ${ state.currentUser && state.currentUser.username !== video.username ? ` <button class="follow-small ${ isFollowing ? "following" : "" }" data-action="follow" data-username="${escapeHTML(video.username)}"> ${isFollowing ? "Following" : "Follow"} </button> ` : "" } </div> <div class="video-caption"> ${escapeHTML(video.caption || "")} </div> <div class="video-music"> 🎵 ${escapeHTML(video.music || "Original sound")} </div> </div> <div class="video-actions"> <button class="action-button ${ liked ? "liked" : "" }" data-action="like"> <span>♥</span> <small> ${formatNumber( video.likes + (liked ? 1 : 0) )} </small> </button> <button class="action-button" data-action="comment"> <span>💬</span> <small> ${formatNumber( getCommentCount(video.id) )} </small> </button> <button class="action-button" data-action="share"> <span>↗</span> <small> ${formatNumber(video.shares || 0)} </small> </button> <button class="action-button" data-action="sound"> <span>🔇</span> <small>Sound</small> </button> </div> `; videoFeed.appendChild(card); }); setupVideoObserver(); setupVideoEvents(); 
}
/* ===================================================== VIDEO OBSERVER ===================================================== */
let videoObserver;
function setupVideoObserver() {
if (videoObserver) { videoObserver.disconnect(); } videoObserver = new IntersectionObserver( entries => { entries.forEach(entry => { const video = entry.target; if ( entry.isIntersecting && entry.intersectionRatio > 0.65 ) { pauseAllExcept(video); video.muted = state.muted; video.play() .catch(() => {}); } else { video.pause(); } }); }, { threshold: [0.65] } ); document .querySelectorAll(".video-card video") .forEach(video => { videoObserver.observe(video); }); 
}
function pauseAllExcept(current) {
document .querySelectorAll(".video-card video") .forEach(video => { if (video !== current) { video.pause(); } }); 
}
/* ===================================================== VIDEO INTERACTION ===================================================== */
function setupVideoEvents() {
document .querySelectorAll(".video-card") .forEach(card => { const video = card.querySelector("video"); video.addEventListener( "click", () => { if (video.paused) { video.play() .catch(() => {}); card.classList.remove( "paused" ); } else { video.pause(); card.classList.add( "paused" ); } } ); video.addEventListener( "volumechange", () => { const sound = card.querySelector( '[data-action="sound"] span' ); if (sound) { sound.textContent = video.muted ? "🔇" : "🔊"; } } ); }); 
}
/* ===================================================== FEED BUTTONS ===================================================== */
videoFeed.addEventListener( "click", event => {
const button = event.target.closest( "[data-action]" ); if (!button) return; const card = button.closest(".video-card"); if (!card) return; const videoId = card.dataset.id; const action = button.dataset.action; if (action === "like") { toggleLike(videoId); } if (action === "comment") { openComments(videoId); } if (action === "share") { shareVideo(videoId); } if (action === "sound") { toggleSound(card); } if (action === "follow") { const username = button.dataset.username; toggleFollow(username); } } 
);
function toggleLike(videoId) {
if (!requireLogin()) return; state.likes[videoId] = !state.likes[videoId]; saveLikes(); renderFeed(); showToast( state.likes[videoId] ? "Liked ❤️" : "Like removed" ); 
}
function toggleFollow(username) {
if (!requireLogin()) return; const index = state.following.indexOf(username); if (index === -1) { state.following.push(username); showToast( `Following @${username}` ); } else { state.following.splice( index, 1 ); showToast( `Unfollowed @${username}` ); } saveFollowing(); updateProfile(); renderFeed(); 
}
function toggleSound(card) {
const video = card.querySelector("video"); state.muted = !state.muted; document .querySelectorAll(".video-card video") .forEach(v => { v.muted = state.muted; }); video.muted = state.muted; showToast( state.muted ? "Sound off" : "Sound on" ); 
}
/* ===================================================== COMMENTS ===================================================== */
function getCommentCount(videoId) {
return ( state.comments[videoId] || [] ).length; 
}
function openComments(videoId) {
state.currentVideoId = videoId; renderComments(); commentsModal.classList.remove( "hidden" ); 
}
function renderComments() {
const list = state.comments[ state.currentVideoId ] || []; commentsList.innerHTML = ""; if (!list.length) { commentsList.innerHTML = ` <div style=" text-align:center; color:#777; padding:40px 10px;"> No comments yet.<br> Be the first to comment! </div> `; return; } list.forEach(comment => { const item = document.createElement("div"); item.className = "comment"; item.innerHTML = ` <div class="comment-avatar"> ${getInitial(comment.username)} </div> <div class="comment-content"> <strong> @${escapeHTML(comment.username)} </strong> <p> ${escapeHTML(comment.text)} </p> </div> `; commentsList.appendChild(item); }); 
}
function addComment() {
if (!requireLogin()) return; const text = commentInput.value.trim(); if (!text) return; if (!state.comments[ state.currentVideoId ]) { state.comments[ state.currentVideoId ] = []; } state.comments[ state.currentVideoId ].push({ username: state.currentUser.username, text: text, createdAt: Date.now() }); saveComments(); commentInput.value = ""; renderComments(); renderFeed(); showToast("Comment added 💬"); 
}
/* ===================================================== SHARE ===================================================== */
async function shareVideo(videoId) {
const url = window.location.href.split("#")[0] + "#video=" + encodeURIComponent(videoId); if ( navigator.share ) { try { await navigator.share({ title: "Watch this on Loopa", text: "Check out this video on Loopa!", url: url }); } catch (error) {} } else { try { await navigator.clipboard.writeText( url ); showToast( "Video link copied 🔗" ); } catch (error) { showToast( "Share link ready" ); } } 
}
/* ===================================================== SEARCH ===================================================== */
searchButton.addEventListener( "click", () => {
searchPage.classList.remove( "hidden" ); setTimeout(() => { searchInput.focus(); }, 100); } 
);
closeSearch.addEventListener( "click", () => {
searchPage.classList.add( "hidden" ); searchInput.value = ""; searchResults.innerHTML = ""; } 
);
searchInput.addEventListener( "input", () => {
const query = searchInput.value .trim() .toLowerCase(); if (!query) { searchResults.innerHTML = ""; return; } const users = getUniqueUsers() .filter(username => username .toLowerCase() .includes(query) ); const matchingVideos = state.videos.filter(video => ( video.username + " " + video.caption ) .toLowerCase() .includes(query) ); searchResults.innerHTML = ""; users.forEach(username => { const result = document.createElement("div"); result.className = "search-result"; result.innerHTML = ` <div class="avatar"> ${getInitial(username)} </div> <div class="search-result-info"> <strong> @${escapeHTML(username)} </strong> <span> Creator on Loopa </span> </div> `; searchResults.appendChild(result); }); matchingVideos.forEach(video => { const result = document.createElement("div"); result.className = "search-result"; result.innerHTML = ` <div class="avatar"> ▶ </div> <div class="search-result-info"> <strong> ${escapeHTML( video.caption || "Loopa video" )} </strong> <span> @${escapeHTML(video.username)} </span> </div> `; searchResults.appendChild(result); }); if ( !users.length && !matchingVideos.length ) { searchResults.innerHTML = ` <div style=" text-align:center; color:#777; padding:40px;"> No results found </div> `; } } 
);
/* ===================================================== UPLOAD ===================================================== */
uploadButton.addEventListener( "click", () => {
if (!requireLogin()) return; uploadPage.classList.remove( "hidden" ); } 
);
closeUpload.addEventListener( "click", () => {
uploadPage.classList.add( "hidden" ); } 
);
let selectedVideoURL = null;
videoInput.addEventListener( "change", () => {
const file = videoInput.files[0]; if (!file) return; if (!file.type.startsWith("video/")) { showToast( "Please select a video" ); return; } if (selectedVideoURL) { URL.revokeObjectURL( selectedVideoURL ); } selectedVideoURL = URL.createObjectURL(file); videoPreview.innerHTML = ` <video src="${selectedVideoURL}" controls playsinline> </video> `; } 
);
publishButton.addEventListener( "click", () => {
if (!requireLogin()) return; if (!selectedVideoURL) { showToast( "Choose a video first" ); return; } const caption = captionInput.value.trim(); const newVideo = { id: "video-" + Date.now(), username: state.currentUser.username, caption: caption || "My first Loopa video 🎬", music: "Original sound", likes: 0, shares: 0, views: 0, video: selectedVideoURL, local: true }; state.videos.unshift( newVideo ); saveVideos(); renderFeed(); videoInput.value = ""; captionInput.value = ""; videoPreview.innerHTML = ""; selectedVideoURL = null; uploadPage.classList.add( "hidden" ); showToast( "Video published 🎉" ); } 
);
/* ===================================================== PROFILE ===================================================== */
function updateProfile() {
if (!state.currentUser) return; const username = document.getElementById( "profileUsername" ); const bio = document.getElementById( "profileBio" ); username.textContent = "@" + state.currentUser.username; bio.textContent = state.currentUser.bio || "Welcome to Loopa 🎬"; document.getElementById( "followingCount" ).textContent = state.following.length; const followerCount = state.videos.filter( video => video.username === state.currentUser.username ).length; document.getElementById( "followersCount" ).textContent = followerCount; const totalLikes = state.videos .filter( video => video.username === state.currentUser.username ) .reduce( (total, video) => total + video.likes + ( state.likes[video.id] ? 1 : 0 ), 0 ); document.getElementById( "likesCount" ).textContent = formatNumber(totalLikes); renderProfileVideos(); 
}
function renderProfileVideos() {
profileVideos.innerHTML = ""; if (!state.currentUser) return; const videos = state.videos.filter( video => video.username === state.currentUser.username ); videos.forEach(video => { const item = document.createElement("div"); item.className = "profile-video"; item.innerHTML = ` <video src="${escapeHTML(video.video)}" muted preload="metadata"> </video> `; profileVideos.appendChild(item); }); 
}
/* ===================================================== NAVIGATION ===================================================== */
document .querySelectorAll(".nav-item") .forEach(button => {
button.addEventListener( "click", () => { const page = button.dataset.page; document .querySelectorAll( ".nav-item" ) .forEach(item => item.classList.remove( "active" ) ); button.classList.add( "active" ); if (page === "home") { hidePages(); videoFeed.scrollTo({ top: 0, behavior: "smooth" }); } if (page === "discover") { searchPage.classList.remove( "hidden" ); setTimeout(() => { searchInput.focus(); }, 100); } if (page === "profile") { if (!requireLogin()) { return; } hidePages(); profilePage.classList.remove( "hidden" ); updateProfile(); } if (page === "notifications") { if (!requireLogin()) { return; } showToast( "No new activity" ); } } ); }); 
function hidePages() {
searchPage.classList.add( "hidden" ); uploadPage.classList.add( "hidden" ); profilePage.classList.add( "hidden" ); 
}
/* ===================================================== COMMENTS EVENTS ===================================================== */
closeComments.addEventListener( "click", () => {
commentsModal.classList.add( "hidden" ); } 
);
commentsModal.addEventListener( "click", event => {
if ( event.target === commentsModal ) { commentsModal.classList.add( "hidden" ); } } 
);
sendComment.addEventListener( "click", addComment );
commentInput.addEventListener( "keydown", event => {
if ( event.key === "Enter" ) { addComment(); } } 
);
/* ===================================================== LOGIN EVENTS ===================================================== */
loginButton.addEventListener( "click", loginUser );
closeLogin.addEventListener( "click", () => {
loginModal.classList.add( "hidden" ); } 
);
passwordInput.addEventListener( "keydown", event => {
if ( event.key === "Enter" ) { loginUser(); } } 
);
/* ===================================================== HELPERS ===================================================== */
function getInitial(username) {
if (!username) return "L"; return username .charAt(0) .toUpperCase(); 
}
function formatNumber(number) {
if (number >= 1000000) { return ( (number / 1000000) .toFixed(1) .replace(".0", "") + "M" ); } if (number >= 1000) { return ( (number / 1000) .toFixed(1) .replace(".0", "") + "K" ); } return String(number); 
}
function getUniqueUsers() {
return [ ...new Set( state.videos.map( video => video.username ) ) ]; 
}
function escapeHTML(value) {
const div = document.createElement("div"); div.textContent = String(value ?? ""); return div.innerHTML; 
}
/* ===================================================== KEYBOARD / TOUCH ===================================================== */
document.addEventListener( "keydown", event => {
if ( event.key === "Escape" ) { searchPage.classList.add( "hidden" ); uploadPage.classList.add( "hidden" ); commentsModal.classList.add( "hidden" ); loginModal.classList.add( "hidden" ); } } 
);
/* ===================================================== START APP ===================================================== */
function startApp() {
renderFeed(); if (state.currentUser) { updateProfile(); } setTimeout(() => { loadingScreen.classList.add( "hidden" ); app.classList.remove( "hidden" ); const firstVideo = document.querySelector( ".video-card video" ); if (firstVideo) { firstVideo.muted = true; firstVideo.play() .catch(() => {}); } }, 900); 
}
startApp();
/*
END OF LOOPA APP © Developed by Salah Mustapha
*/
/* ===================== LOOPA FREE REALTIME LIVE ===================== */
const SUPABASE_URL = "https://aqmjqkudccnjgntuffzi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_A-G1gpUcZy6gNBzyMSNOZA_Pxg4DvzP";
let loopaSupabase = null;
try { if (window.supabase) loopaSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY); } catch(e) { console.warn("Supabase Realtime unavailable", e); }

const liveButton = document.getElementById("liveButton");
const livePage = document.getElementById("livePage");
const closeLivePage = document.getElementById("closeLivePage");
const liveHome = document.getElementById("liveHome");
const liveList = document.getElementById("liveList");
const goLiveButton = document.getElementById("goLiveButton");
const broadcasterPanel = document.getElementById("broadcasterPanel");
const viewerPanel = document.getElementById("viewerPanel");
const broadcasterVideo = document.getElementById("broadcasterVideo");
const viewerVideo = document.getElementById("viewerVideo");
const broadcasterViewerCount = document.getElementById("broadcasterViewerCount");
const viewerCount = document.getElementById("viewerCount");
const liveTitleInput = document.getElementById("liveTitleInput");
const viewerTitle = document.getElementById("viewerTitle");
const viewerHost = document.getElementById("viewerHost");
const broadcasterChatList = document.getElementById("broadcasterChatList");
const viewerChatList = document.getElementById("viewerChatList");
const broadcasterChatInput = document.getElementById("broadcasterChatInput");
const viewerChatInput = document.getElementById("viewerChatInput");
const broadcasterChatSend = document.getElementById("broadcasterChatSend");
const viewerChatSend = document.getElementById("viewerChatSend");
const endLiveButton = document.getElementById("endLiveButton");
const flipCameraButton = document.getElementById("flipCameraButton");
const toggleMicButton = document.getElementById("toggleMicButton");

let liveDirectoryChannel = null;
let liveRoomChannel = null;
let liveStream = null;
let liveFacingMode = "user";
let liveIsHost = false;
let liveRoomId = null;
let liveHostId = null;
let livePeerConnections = {};
let livePendingIce = {};
let liveViewerId = "v-" + Math.random().toString(36).slice(2) + Date.now();
let liveDirectoryState = {};

function liveUserId(){ return state.currentUser ? state.currentUser.username : "guest-" + liveViewerId; }
function liveRoomName(username){ return "loopa-live-" + String(username).toLowerCase().replace(/[^a-z0-9_-]/g,"-"); }
function liveEsc(v){ return escapeHTML(v || ""); }
function addLiveMessage(listEl, username, text){
  if(!listEl) return;
  const row=document.createElement("div"); row.className="live-message";
  row.innerHTML=`<strong>@${liveEsc(username)}</strong> <span>${liveEsc(text)}</span>`;
  listEl.appendChild(row); listEl.scrollTop=listEl.scrollHeight;
}
function showLivePage(){
  if(!requireLogin()) return;
  hidePages(); livePage.classList.remove("hidden"); liveHome.classList.remove("hidden"); broadcasterPanel.classList.add("hidden"); viewerPanel.classList.add("hidden"); refreshLiveDirectory();
}
function resetLivePanels(){ liveHome.classList.remove("hidden"); broadcasterPanel.classList.add("hidden"); viewerPanel.classList.add("hidden"); }
function cleanupPeerConnections(){ Object.values(livePeerConnections).forEach(pc=>{try{pc.close()}catch(e){}}); livePeerConnections={}; livePendingIce={}; }
async function stopLiveStream(){ if(liveStream){liveStream.getTracks().forEach(t=>t.stop()); liveStream=null;} broadcasterVideo.srcObject=null; cleanupPeerConnections(); }
async function leaveLiveRoom(){
  await stopLiveStream();
  if(liveRoomChannel && loopaSupabase){ try{await loopaSupabase.removeChannel(liveRoomChannel)}catch(e){} }
  liveRoomChannel=null; liveRoomId=null; liveHostId=null; liveIsHost=false;
}
async function refreshLiveDirectory(){
  if(!loopaSupabase){liveList.innerHTML='<div class="live-empty">Realtime is unavailable right now.</div>';return;}
  if(liveDirectoryChannel){try{await loopaSupabase.removeChannel(liveDirectoryChannel)}catch(e){}}
  liveDirectoryChannel=loopaSupabase.channel("loopa-live-directory",{config:{presence:{key:liveUserId()},broadcast:{self:false}}});
  liveDirectoryChannel.on("presence",{event:"sync"},renderLiveDirectory);
  liveDirectoryChannel.on("presence",{event:"join"},renderLiveDirectory);
  liveDirectoryChannel.on("presence",{event:"leave"},renderLiveDirectory);
  await liveDirectoryChannel.subscribe(async status=>{ if(status==="SUBSCRIBED") renderLiveDirectory(); });
}
function renderLiveDirectory(){
  if(!liveDirectoryChannel) return;
  const raw=liveDirectoryChannel.presenceState(); liveDirectoryState={};
  Object.values(raw).flat().forEach(p=>{if(p&&p.hostId) liveDirectoryState[p.hostId]=p;});
  const items=Object.values(liveDirectoryState);
  liveList.innerHTML="";
  if(!items.length){liveList.innerHTML='<div class="live-empty">No one is LIVE right now.</div>';return;}
  items.forEach(item=>{
    const card=document.createElement("div"); card.className="live-card";
    card.innerHTML=`<div class="live-avatar">${getInitial(item.username)}</div><div class="live-card-info"><strong>@${liveEsc(item.username)}</strong><span>${liveEsc(item.title||"LIVE now")}</span></div><button class="watch-live-button" data-live-host="${liveEsc(item.hostId)}">Watch</button>`;
    liveList.appendChild(card);
  });
}
async function startHostLive(){
  if(!requireLogin()) return;
  if(!loopaSupabase){showToast("Realtime is not connected");return;}
  try{
    liveStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:liveFacingMode,width:{ideal:720},height:{ideal:1280}},audio:true});
    broadcasterVideo.srcObject=liveStream;
    liveIsHost=true; liveHostId=liveUserId(); liveRoomId=liveRoomName(liveHostId);
    liveHome.classList.add("hidden"); broadcasterPanel.classList.remove("hidden");
    liveTitleInput.value=state.currentUser.username+" is LIVE 🔥";
    broadcasterChatList.innerHTML="";
    liveRoomChannel=loopaSupabase.channel(liveRoomId,{config:{broadcast:{self:false},presence:{key:liveHostId}}});
    liveRoomChannel.on("broadcast",{event:"join"},handleHostJoin);
    liveRoomChannel.on("broadcast",{event:"answer"},handleHostAnswer);
    liveRoomChannel.on("broadcast",{event:"ice"},handleHostIce);
    liveRoomChannel.on("broadcast",{event:"chat"},payload=>addLiveMessage(broadcasterChatList,payload.payload.username,payload.payload.text));
    liveRoomChannel.on("broadcast",{event:"reaction"},()=>showToast("❤️"));
    await liveRoomChannel.subscribe(async status=>{
      if(status!=="SUBSCRIBED") {showToast("Could not start LIVE"); return;}
      if(liveDirectoryChannel){await liveDirectoryChannel.track({hostId:liveHostId,username:state.currentUser.username,title:liveTitleInput.value||"LIVE now",startedAt:Date.now()});}
      showToast("You are LIVE 🔥");
    });
  }catch(e){console.error(e); showToast("Camera/microphone permission is needed"); await leaveLiveRoom(); resetLivePanels();}
}
async function handleHostJoin(msg){
  const p=msg.payload||{}; const viewer=p.viewerId; if(!viewer) return;
  try{
    const pc=new RTCPeerConnection({iceServers:[{urls:"stun:stun.l.google.com:19302"},{urls:"stun:stun1.l.google.com:19302"}]});
    livePeerConnections[viewer]=pc;
    livePendingIce[viewer]=[];
    liveStream.getTracks().forEach(track=>pc.addTrack(track,liveStream));
    pc.onicecandidate=ev=>{if(ev.candidate) liveRoomChannel.send({type:"broadcast",event:"ice",payload:{target:viewer,candidate:ev.candidate}})};
    pc.onconnectionstatechange=()=>{ if(["failed","closed","disconnected"].includes(pc.connectionState)){try{pc.close()}catch(e){} delete livePeerConnections[viewer]; updateHostViewerCount();} };
    const offer=await pc.createOffer(); await pc.setLocalDescription(offer);
    await liveRoomChannel.send({type:"broadcast",event:"offer",payload:{target:viewer,offer:pc.localDescription}});
    updateHostViewerCount();
  }catch(e){console.warn("offer failed",e)}
}
async function handleHostAnswer(msg){
  const p=msg.payload||{}; if(!p.viewerId||p.viewerId===liveHostId) return; const pc=livePeerConnections[p.viewerId]; if(pc&&p.answer){try{await pc.setRemoteDescription(new RTCSessionDescription(p.answer))}catch(e){console.warn(e)}}
}
async function handleHostIce(msg){
  const p=msg.payload||{}; const pc=livePeerConnections[p.viewerId||p.from]; if(pc&&p.candidate){try{await pc.addIceCandidate(p.candidate)}catch(e){}}
}
function updateHostViewerCount(){broadcasterViewerCount.textContent=Object.keys(livePeerConnections).length;}
async function watchLive(host){
  if(!requireLogin()) return;
  const info=liveDirectoryState[host]; if(!info){showToast("That LIVE has ended");refreshLiveDirectory();return;}
  await leaveLiveRoom(); liveIsHost=false; liveHostId=host; liveRoomId=liveRoomName(host);
  liveHome.classList.add("hidden"); viewerPanel.classList.remove("hidden"); viewerTitle.textContent=info.title||"LIVE"; viewerHost.textContent="@"+info.username; viewerChatList.innerHTML="";
  if(!loopaSupabase){showToast("Realtime is not connected");return;}
  liveRoomChannel=loopaSupabase.channel(liveRoomId,{config:{broadcast:{self:false},presence:{key:liveViewerId}}});
  liveRoomChannel.on("broadcast",{event:"offer"},handleViewerOffer);
  liveRoomChannel.on("broadcast",{event:"ice"},handleViewerIce);
  liveRoomChannel.on("broadcast",{event:"chat"},p=>addLiveMessage(viewerChatList,p.payload.username,p.payload.text));
  liveRoomChannel.on("broadcast",{event:"live_ended"},()=>{showToast("LIVE ended");closeLiveUI()});
  liveRoomChannel.on("broadcast",{event:"reaction"},()=>showToast("❤️"));
  await liveRoomChannel.subscribe(async status=>{ if(status==="SUBSCRIBED"){await liveRoomChannel.send({type:"broadcast",event:"join",payload:{viewerId:liveViewerId}}); showToast("Joined LIVE 🔥");} });
}
let viewerPeer=null;
async function handleViewerOffer(msg){
  const p=msg.payload||{}; if(p.target!==liveViewerId||!p.offer)return;
  try{
    if(viewerPeer){try{viewerPeer.close()}catch(e){}}
    viewerPeer=new RTCPeerConnection({iceServers:[{urls:"stun:stun.l.google.com:19302"},{urls:"stun:stun1.l.google.com:19302"}]});
    viewerPeer.ontrack=e=>{viewerVideo.srcObject=e.streams[0]; viewerVideo.play().catch(()=>{})};
    viewerPeer.onicecandidate=e=>{if(e.candidate) liveRoomChannel.send({type:"broadcast",event:"ice",payload:{viewerId:liveViewerId,candidate:e.candidate}})};
    await viewerPeer.setRemoteDescription(new RTCSessionDescription(p.offer));
    const answer=await viewerPeer.createAnswer(); await viewerPeer.setLocalDescription(answer);
    await liveRoomChannel.send({type:"broadcast",event:"answer",payload:{viewerId:liveViewerId,answer:viewerPeer.localDescription}});
  }catch(e){console.warn("viewer offer failed",e)}
}
async function handleViewerIce(msg){const p=msg.payload||{};if(p.viewerId!==liveViewerId||!p.candidate||!viewerPeer)return;try{await viewerPeer.addIceCandidate(p.candidate)}catch(e){}}
async function closeLiveUI(){
  if(liveIsHost&&liveDirectoryChannel){try{await liveDirectoryChannel.untrack()}catch(e){}}
  if(liveRoomChannel){try{await liveRoomChannel.send({type:"broadcast",event:"live_ended",payload:{}})}catch(e){}}
  if(viewerPeer){try{viewerPeer.close()}catch(e){}viewerPeer=null}
  await leaveLiveRoom(); resetLivePanels(); viewerVideo.srcObject=null; hidePages();
}
async function endHostLive(){
  if(liveIsHost&&liveDirectoryChannel){try{await liveDirectoryChannel.untrack()}catch(e){}}
  if(liveRoomChannel){try{await liveRoomChannel.send({type:"broadcast",event:"live_ended",payload:{}})}catch(e){}}
  showToast("LIVE ended"); await leaveLiveRoom(); resetLivePanels(); refreshLiveDirectory();
}
async function sendLiveChat(input){
  const text=input.value.trim(); if(!text||!liveRoomChannel)return; const username=state.currentUser?.username||"guest";
  addLiveMessage(liveIsHost?broadcasterChatList:viewerChatList,username,text); input.value="";
  await liveRoomChannel.send({type:"broadcast",event:"chat",payload:{username,text}});
}

liveButton?.addEventListener("click",showLivePage);
closeLivePage?.addEventListener("click",async()=>{await closeLiveUI()});
goLiveButton?.addEventListener("click",startHostLive);
endLiveButton?.addEventListener("click",endHostLive);
broadcasterChatSend?.addEventListener("click",()=>sendLiveChat(broadcasterChatInput));
viewerChatSend?.addEventListener("click",()=>sendLiveChat(viewerChatInput));
broadcasterChatInput?.addEventListener("keydown",e=>{if(e.key==="Enter")sendLiveChat(broadcasterChatInput)});
viewerChatInput?.addEventListener("keydown",e=>{if(e.key==="Enter")sendLiveChat(viewerChatInput)});
liveList?.addEventListener("click",e=>{const b=e.target.closest("[data-live-host]");if(b)watchLive(b.dataset.liveHost)});
flipCameraButton?.addEventListener("click",async()=>{liveFacingMode=liveFacingMode==="user"?"environment":"user";if(liveStream){liveStream.getTracks().forEach(t=>t.stop());liveStream=null}try{liveStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:liveFacingMode},audio:true});broadcasterVideo.srcObject=liveStream;Object.values(livePeerConnections).forEach(async pc=>{const sender=pc.getSenders().find(s=>s.track&&s.track.kind==="video");if(sender)await sender.replaceTrack(liveStream.getVideoTracks()[0])})}catch(e){showToast("Camera switch failed")}});
toggleMicButton?.addEventListener("click",()=>{if(!liveStream)return;const t=liveStream.getAudioTracks()[0];if(!t)return;t.enabled=!t.enabled;toggleMicButton.textContent=t.enabled?"🎙️ Mic ON":"🔇 Mic OFF"});
liveTitleInput?.addEventListener("input",async()=>{if(liveIsHost&&liveDirectoryChannel){try{await liveDirectoryChannel.track({hostId:liveHostId,username:state.currentUser.username,title:liveTitleInput.value||"LIVE now",startedAt:Date.now()})}catch(e){}}});

// Realtime directory is opened when the user first opens LIVE.
