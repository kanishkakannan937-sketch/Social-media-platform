const API_URL = "http://localhost:5001/api";

const token = localStorage.getItem("token");

// Load posts when home page opens
document.addEventListener("DOMContentLoaded", () => {
    loadPosts();
});

// Create post
async function createPost() {
    if (!token) {
        alert("Please login first");
        window.location.href = "login.html";
        return;
    }

    const content = document.getElementById("postContent").value.trim();
    const image = document.getElementById("postImage").value.trim();

    if (!content) {
        alert("Please enter some content");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/posts`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                content,
                image
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to create post");
            return;
        }

        document.getElementById("postContent").value = "";
        document.getElementById("postImage").value = "";

        loadPosts();

    } catch (error) {
        console.error(error);
        alert("Server connection failed");
    }
}

// Load all posts
async function loadPosts() {
    const container = document.getElementById("postsContainer");

    if (!container) return;

    try {
        const response = await fetch(`${API_URL}/posts`);
        const posts = await response.json();

        container.innerHTML = "";

        if (posts.length === 0) {
            container.innerHTML = "<p>No posts yet.</p>";
            return;
        }

        posts.forEach(post => {
            const postElement = document.createElement("div");

            postElement.className = "post-card";

            postElement.innerHTML = `
                <h3>${post.user?.name || "User"}</h3>

                <p>${post.content}</p>

                ${
                    post.image
                        ? `<img src="${post.image}" alt="Post image">`
                        : ""
                }

                <div class="post-actions">
                    <button onclick="likePost('${post._id}')">
                        ❤️ ${post.likes.length}
                    </button>

                    <span>
                        💬 ${post.comments.length}
                    </span>
                </div>

                <div class="comment-section">
                    <input
                        type="text"
                        id="comment-${post._id}"
                        placeholder="Write a comment..."
                    >

                    <button onclick="addComment('${post._id}')">
                        Comment
                    </button>
                </div>

                <div class="comments">
                    ${post.comments.map(comment => `
                        <p>
                            <strong>${comment.user?.name || "User"}:</strong>
                            ${comment.text}
                        </p>
                    `).join("")}
                </div>
            `;

            container.appendChild(postElement);
        });

    } catch (error) {
        console.error(error);
        container.innerHTML = "<p>Failed to load posts.</p>";
    }
}

// Like / Unlike
async function likePost(postId) {
    if (!token) {
        alert("Please login first");
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/posts/${postId}/like`,
            {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message);
            return;
        }

        loadPosts();

    } catch (error) {
        console.error(error);
    }
}

// Add comment
async function addComment(postId) {
    if (!token) {
        alert("Please login first");
        return;
    }

    const input = document.getElementById(`comment-${postId}`);
    const text = input.value.trim();

    if (!text) {
        alert("Enter a comment");
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/posts/${postId}/comment`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ text })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message);
            return;
        }

        input.value = "";
        loadPosts();

    } catch (error) {
        console.error(error);
    }
}

// Logout
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "login.html";
}