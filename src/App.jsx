import { apiUrl } from "./api";
import { useEffect, useState } from "react";
import "./App.css";
import Auth from "./Auth";

const samplePosts = [
  {
    id: 1,
    title: "The Art of Building with Java",
    category: "Java",
    content:
      "From your first class to clean architecture, discover how small coding habits can make a big difference.",
    readTime: "5 min read",
    accent: "mint",
    symbol: "{ }",
    featured: true,
  },
  {
    id: 2,
    title: "Spring Boot, Without the Confusion",
    category: "Spring Boot",
    content:
      "A beginner-friendly look at REST APIs, dependency injection, and the ideas behind modern Java backends.",
    readTime: "7 min read",
    accent: "peach",
    symbol: "☘",
  },
  {
    id: 3,
    title: "Your First Full Stack Adventure",
    category: "Projects",
    content:
      "How frontend, backend, and databases work together to turn an idea into a real application.",
    readTime: "6 min read",
    accent: "lilac",
    symbol: "↗",
  },
  {
    id: 4,
    title: "React: Small Components, Big Ideas",
    category: "React",
    content:
      "Make interfaces easier to understand by breaking your UI into reusable building blocks.",
    readTime: "4 min read",
    accent: "blue",
    symbol: "⚛",
  },
];

const categories = [
  "All stories",
  "Java",
  "Spring Boot",
  "React",
  "Projects",
  "Technology",
];

const accents = ["mint", "peach", "lilac", "blue"];
const symbols = ["{ }", "☘", "↗", "⚛"];

// Get a fresh CSRF token before a POST, PUT or DELETE request.
async function getCsrfToken() {
  const response = await fetch(apiUrl("/api/auth/csrf"), {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Could not get the security token. Please try again.");
  }

  return response.json();
}

async function secureRequest(url, options = {}) {
  const csrf = await getCsrfToken();

 // Inside getCsrfToken()
fetch(apiUrl("/api/auth/csrf"), {
  credentials: "include",
});
}

function CommentsSection({ postId, currentUser, onRequestAuth }) {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function loadComments() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          apiUrl(`/api/posts/${postId}/comments`),
          { credentials: "include" }
        );

        if (!response.ok) {
          throw new Error("Could not load comments.");
        }

        const data = await response.json();

        if (!cancelled) {
          setComments(data);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadComments();

    return () => {
      cancelled = true;
    };
  }, [postId, isOpen]);

  async function addComment(event) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || isSubmitting) return;

    if (!currentUser) {
      onRequestAuth();
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await secureRequest(
        `/api/posts/${postId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmedMessage }),
        }
      );

      if (response.status === 401) {
        onRequestAuth();
        return;
      }

      if (!response.ok) {
        throw new Error(
          response.status === 403
            ? "Security check failed. Please try again."
            : "Could not publish your comment."
        );
      }

      const savedComment = await response.json();

      setComments((previous) => [...previous, savedComment]);
      setMessage("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="comments-section">
      <button
        type="button"
        className="cancel-button comments-toggle"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-expanded={isOpen}
      >
        {isOpen ? "Hide comments ↑" : "View comments ↓"}
      </button>

      {isOpen && (
        <div className="comments-panel">
          <h4>Conversation</h4>

          {isLoading && <p>Loading comments...</p>}

          {error && (
            <p className="comments-error" role="alert">
              {error}
            </p>
          )}

          {!isLoading &&
            comments.map((comment) => (
              <div className="comment-item" key={comment.id}>
                <p>{comment.message}</p>
              </div>
            ))}

          {!isLoading && !error && comments.length === 0 && (
            <p className="comments-empty">
              No comments yet. Start the conversation!
            </p>
          )}

          {currentUser ? (
            <form className="comment-form" onSubmit={addComment}>
              <label>
                YOUR COMMENT
                <textarea
                  className="comment-input"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Share your thoughts..."
                  maxLength={2000}
                  rows={3}
                  required
                />
              </label>

              <button
                className="publish-button"
                type="submit"
                disabled={isSubmitting || !message.trim()}
              >
                {isSubmitting ? "Posting..." : "Add comment"}
                <span>↗</span>
              </button>
            </form>
          ) : (
            <p>
              <button
                className="cancel-button"
                type="button"
                onClick={onRequestAuth}
              >
                Log in
              </button>{" "}
              to join the conversation.
            </p>
          )}
        </div>
      )}
    </section>
  );
}


function LikeButton({ postId, currentUser, onRequestAuth }) {
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadLikes() {
      setIsLoading(true);
      setError("");

      try {
        const countResponse = await fetch(
          apiUrl(`/api/posts/${postId}/likes`)
        );

        if (!countResponse.ok) {
          throw new Error("Could not load likes.");
        }

        const countData = await countResponse.json();

        if (!cancelled) {
          setLikeCount(countData.likeCount);
        }

        if (currentUser) {
          const statusResponse = await fetch(
            apiUrl(`/api/posts/${postId}/likes/me`),
            { credentials: "include" }
          );

          if (statusResponse.status === 401) {
            if (!cancelled) setLiked(false);
          } else if (!statusResponse.ok) {
            throw new Error("Could not load your like status.");
          } else {
            const statusData = await statusResponse.json();

            if (!cancelled) {
              setLiked(statusData.liked);
            }
          }
        } else if (!cancelled) {
          setLiked(false);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadLikes();

    return () => {
      cancelled = true;
    };
  }, [postId, currentUser?.id]);

  async function toggleLike() {
    if (isUpdating) return;

    if (!currentUser) {
      onRequestAuth();
      return;
    }

    setIsUpdating(true);
    setError("");

    try {
      const response = await secureRequest(
        `/api/posts/${postId}/like`,
        {
          method: liked ? "DELETE" : "POST",
        }
      );

      if (response.status === 401) {
        onRequestAuth();
        return;
      }

      if (!response.ok) {
        throw new Error(
          response.status === 403
            ? "Security check failed. Please try again."
            : "Could not update your like."
        );
      }

      const data = await response.json();

      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch (err) {
      setError(err.message || "Could not update your like.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="like-section">
      <button
        type="button"
        className={`like-button ${liked ? "is-liked" : ""}`}
        onClick={toggleLike}
        disabled={isUpdating || isLoading}
        aria-label={
          liked
            ? `Unlike this story. ${likeCount} likes`
            : `Like this story. ${likeCount} likes`
        }
        aria-pressed={liked}
      >
        <span aria-hidden="true">
          {liked ? "♥" : "♡"}
        </span>

        <span>
          {isLoading
            ? "Loading..."
            : liked
              ? "Liked"
              : "Like"}
        </span>

        <span className="like-count">
          {likeCount}
        </span>
      </button>

      {error && (
        <p className="like-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}


function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const [posts, setPosts] = useState(samplePosts);
  const [showMyStories, setShowMyStories] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All stories");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Java");
  const [content, setContent] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);

async function loadMyStories() {
  if (!currentUser) {
    requestAuth();
    return;
  }

  setIsLoading(true);
  setNotice("");

  try {
    const response = await fetch(apiUrl("/api/posts/my-stories"), {
      credentials: "include",
    });

    if (response.status === 401 || response.status === 403) {
      setNotice("Please log in again to view your stories.");
      return;
    }

    if (!response.ok) {
      throw new Error(`Could not load My Stories: ${response.status}`);
    }

    const data = await response.json();

    console.log("My Stories API response:", data);

    const myPosts = (data.content ?? []).map((post, index) => ({
      ...post,
      category: post.category || "Technology",
      readTime: "3 min read",
      accent: accents[index % accents.length],
      symbol: symbols[index % symbols.length],
      featured: index === 0,
    }));

 setPosts(myPosts);
setShowMyStories(true);
setSearch("");
setActiveCategory("All stories");
closeEditor();

window.setTimeout(() => {
  document.getElementById("articles")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}, 100);
  } catch (error) {
    console.error("Error loading My Stories:", error);
    setNotice(error.message || "Could not load your stories.");
  } finally {
    setIsLoading(false);
  }
}

async function loadAllStories() {
  setIsLoading(true);
  setNotice("");

  try {
    const response = await fetch(apiUrl("/api/posts"), {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Could not load all stories: ${response.status}`);
    }

    const data = await response.json();

    const apiPosts = (data.content ?? [])
      .filter((post) => post.title && post.content)
      .map((post, index) => ({
        ...post,
        category: post.category || "Technology",
        readTime: "3 min read",
        accent: accents[index % accents.length],
        symbol: symbols[index % symbols.length],
        featured: index === 0,
      }));

    setPosts(apiPosts);
    setShowMyStories(false);
    setSearch("");
    setActiveCategory("All stories");

    document.getElementById("articles")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  } catch (error) {
    console.error("Error loading all stories:", error);
    setNotice(error.message || "Could not load all stories.");
  } finally {
    setIsLoading(false);
  }
}

  // Effect 1: Load posts. This is separate from the login effect.
  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      try {
        const response = await fetch(apiUrl("/api/posts"));

        if (!response.ok) {
          throw new Error(`Could not load posts: ${response.status}`);
        }

        const data = await response.json();

        const apiPosts = (data.content ?? [])
          .filter((post) => post.title && post.content)
          .map((post, index) => ({
            ...post,
            category: post.category || "Technology",
            readTime: "3 min read",
            accent: accents[index % accents.length],
            symbol: symbols[index % symbols.length],
            featured: index === 0,
          }));

        if (!cancelled) setPosts(apiPosts);
      } catch (error) {
        console.error("Error loading blog posts:", error);

        if (!cancelled) {
          setNotice(
            "Could not load posts from the server. Showing sample stories."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadPosts();

    return () => {
      cancelled = true;
    };
  }, []);

  // Effect 2: Check whether a valid login session exists.
  useEffect(() => {
    let cancelled = false;

    async function checkLogin() {
      try {
        const response = await fetch(apiUrl("/api/auth/me"), {
          credentials: "include",
        });

        if (!cancelled) {
          if (response.ok) {
            setCurrentUser(await response.json());
          } else {
            setCurrentUser(null);
          }
        }
      } catch (error) {
        console.error("Could not check login:", error);
        if (!cancelled) setCurrentUser(null);
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    }

    checkLogin();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleLogin(user) {
    setCurrentUser(user);
    setShowAuth(false);
    setNotice(`Welcome, ${user.name}!`);
  }

  function requestAuth() {
    setShowAuth(true);
    setNotice("");
  }

  async function handleLogout() {
    try {
      const response = await secureRequest("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Could not log out. Please try again.");
      }

      setCurrentUser(null);
      setShowAuth(false);
      closeEditor();
      setNotice("You have logged out successfully.");
    } catch (error) {
      console.error("Logout error:", error);
      setNotice(error.message);
    }
  }

  const filteredPosts = posts.filter((post) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      (post.title || "").toLowerCase().includes(searchText) ||
      (post.category || "").toLowerCase().includes(searchText) ||
      (post.content || "").toLowerCase().includes(searchText);

    const matchesCategory =
      activeCategory === "All stories" ||
      post.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const featuredPost = posts.find((post) => post.featured);

  const remainingPosts = filteredPosts.filter(
    (post) => post.id !== featuredPost?.id
  );

  function closeEditor() {
    setShowForm(false);
    setEditingPostId(null);
    setTitle("");
    setCategory("Java");
    setContent("");
  }

  function startEdit(post) {
    if (!currentUser) {
      requestAuth();
      return;
    }

    setEditingPostId(post.id);
    setTitle(post.title || "");
    setCategory(post.category || "Technology");
    setContent(post.content || "");
    setNotice("");
    setShowForm(true);

    window.setTimeout(() => {
      document.getElementById("editor")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  async function addPost(event) {
    event.preventDefault();

    if (!currentUser) {
      requestAuth();
      return;
    }

    if (isPublishing) return;

    if (!title.trim() || !content.trim()) {
      setNotice("Please enter both a title and story.");
      return;
    }

    setIsPublishing(true);
    setNotice("");

    const isEditing = editingPostId !== null;

    try {
      const response = await secureRequest(
        isEditing ? `/api/posts/${editingPostId}` : "/api/posts",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
            category,
          }),
        }
      );

      if (response.status === 401) {
        requestAuth();
        return;
      }

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const savedPost = await response.json();

      if (isEditing) {
        setPosts((previous) =>
          previous.map((post) =>
            post.id === editingPostId
              ? {
                ...post,
                ...savedPost,
                category: savedPost.category || category,
              }
              : post
          )
        );

        setNotice("Your story was updated successfully!");
      } else {
        const newPost = {
          ...savedPost,
          category: savedPost.category || category,
          readTime: "3 min read",
          accent: accents[posts.length % accents.length],
          symbol: "✳",
          featured: false,
        };

        setPosts((previous) => [newPost, ...previous]);
        setNotice("Your story was published successfully!");
      }

      closeEditor();
      setActiveCategory("All stories");
      setSearch("");

      document.getElementById("articles")?.scrollIntoView({
        behavior: "smooth",
      });
    } catch (error) {
      console.error("Error saving story:", error);
      setNotice(
        error.message || "Could not save your story. Please try again."
      );
    } finally {
      setIsPublishing(false);
    }
  }

  async function deletePost(post) {
    if (!currentUser) {
      requestAuth();
      return;
    }

    if (deletingPostId !== null) return;

    if (
      !window.confirm(
        `Are you sure you want to delete "${post.title}"?`
      )
    ) {
      return;
    }

    setDeletingPostId(post.id);
    setNotice("");

    try {
      const response = await secureRequest(`/api/posts/${post.id}`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        requestAuth();
        return;
      }

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      setPosts((previous) => {
        const remaining = previous.filter((item) => item.id !== post.id);

        if (post.featured && remaining.length > 0) {
          return remaining.map((item, index) => ({
            ...item,
            featured: index === 0,
          }));
        }

        return remaining;
      });

      if (editingPostId === post.id) closeEditor();

      setNotice("Your story was deleted successfully!");
    } catch (error) {
      console.error("Error deleting story:", error);
      setNotice(error.message || "Could not delete the story.");
    } finally {
      setDeletingPostId(null);
    }
  }


  function PostActions({ post }) {
    // Show Edit and Delete only to the story's author.
    if (
      !currentUser ||
      post.authorId == null ||
      String(post.authorId) !== String(currentUser.id)
    ) {
      return null;
    }

    return (
      <div className="post-management-actions">
        <button
          type="button"
          className="cancel-button"
          onClick={() => startEdit(post)}
          disabled={isPublishing || deletingPostId !== null}
        >
          Edit
        </button>

        <button
          type="button"
          className="cancel-button"
          onClick={() => deletePost(post)}
          disabled={isPublishing || deletingPostId !== null}
        >
          {deletingPostId === post.id ? "Deleting..." : "Delete"}
        </button>
      </div>
    );
  }


  // Display the login/registration page when requested.
  if (showAuth) {
    return (
      <div>
        <button
          type="button"
          className="cancel-button"
          style={{ margin: "16px" }}
          onClick={() => setShowAuth(false)}
        >
          ← Back to stories
        </button>

        <Auth onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="app" id="home">
      <div className="announcement">
        <span className="announcement-dot" />
        A little corner of the internet for curious minds
        <span className="announcement-star">✳</span>
      </div>

            <header className="navbar">
        <a className="brand" href="#home" aria-label="BlogSpace home">
          <span className="brand-icon">b.</span>
          <span>
            blogspace<span className="brand-period">.</span>
          </span>
        </a>

        <nav className="nav-links">
          <a className="nav-active" href="#home">Discover</a>
          <a href="#articles">Stories</a>
          <a href="#about">About</a>
        </nav>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {currentUser ? (
            <>
              <span>{currentUser.name}</span>

              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  if (showMyStories) {
                    loadAllStories();
                  } else {
                    loadMyStories();
                  }
                }}
              >
                {showMyStories ? "All Stories" : "My Stories"}
              </button>

              <button
                type="button"
                className="cancel-button"
                onClick={handleLogout}
              >
                Log out
              </button>

              <button
                type="button"
                className="write-button"
                onClick={() => {
                  if (showForm) {
                    closeEditor();
                  } else {
                    setEditingPostId(null);
                    setTitle("");
                    setCategory("Java");
                    setContent("");
                    setNotice("");
                    setShowForm(true);
                  }
                }}
              >
                {showForm ? "Close editor" : "＋ Write a story"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="cancel-button"
                onClick={requestAuth}
              >
                Log in
              </button>

              <button
                type="button"
                className="write-button"
                onClick={requestAuth}
              >
                Join / Write a story
              </button>
            </>
          )}
        </div>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="hero-kicker">
              <span className="kicker-line" />
              YOUR IDEAS DESERVE A HOME
            </div>

            <h1>
              Think it.
              <br />
              <span className="hero-italic">Write it.</span>
              <br />
              <span className="hero-outline">Share it.</span>
            </h1>

            <p className="hero-description">
              Notes from curious minds. Ideas in progress.
              Stories that make you see things a little differently.
            </p>

            <div className="hero-actions">
              <a href="#articles" className="explore-button">
                Explore stories <span>↘</span>
              </a>
              <span className="hero-note">
                Made for people who love to learn.
              </span>
            </div>

            <div className="hero-bottom-note">
              <span className="tiny-sparkle">✳</span>
              READ SOMETHING THAT STICKS WITH YOU
            </div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-sun" />
            <div className="art-paper paper-back" />

            <div className="art-paper paper-front">
              <span className="paper-label">FIELD NOTES / 001</span>
              <span className="paper-big">Ideas</span>
              <span className="paper-script">grow here.</span>
              <span className="paper-rule" />
              <span className="paper-small">
                COLLECT MOMENTS. SHARE KNOWLEDGE.
              </span>
              <span className="paper-doodle">✳</span>
            </div>

            <div className="floating-tag tag-top">✦ stay curious</div>
            <div className="floating-tag tag-bottom">
              little ideas, big worlds ↗
            </div>
            <div className="art-dot dot-one" />
            <div className="art-dot dot-two" />
            <div className="art-dot dot-three" />
          </div>

          <div className="hero-index">
            <span>01</span>
            <span className="index-line" />
            <span>THE JOURNEY STARTS HERE</span>
          </div>
        </section>

        <section className="marquee-strip" aria-label="Blog topics">
          <div className="marquee-track">
            {[0, 1].map((index) => (
              <div className="marquee-group" key={index}>
                <span>CODE & CREATE</span><i>✳</i>
                <span>LEARN OUT LOUD</span><i>✳</i>
                <span>IDEAS IN MOTION</span><i>✳</i>
                <span>MAKE SOMETHING MATTER</span><i>✳</i>
              </div>
            ))}
          </div>
        </section>

        {showForm && (
          <section className="form-section" id="editor">
            <div className="form-heading">
              <span className="section-kicker">
                {editingPostId !== null ? "EDIT YOUR STORY" : "YOUR NEXT CHAPTER"}
              </span>

              <h2>
                {editingPostId !== null ? (
                  <>Make your story <em>even better.</em></>
                ) : (
                  <>Put your thoughts <em>into words.</em></>
                )}
              </h2>

              <p>
                {editingPostId !== null
                  ? "Update your details and save your changes."
                  : "Every great story starts with a first sentence."}
              </p>
            </div>

            <form onSubmit={addPost}>
              <label>
                STORY TITLE
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Give your story a name..."
                  maxLength={120}
                  required
                />
              </label>

              <label>
                CHOOSE A TOPIC
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option>Java</option>
                  <option>Spring Boot</option>
                  <option>React</option>
                  <option>Projects</option>
                  <option>Technology</option>
                </select>
              </label>

              <label>
                YOUR STORY
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Start anywhere. Write what you learned, built, or imagined..."
                  rows={6}
                  required
                />
              </label>

              <div className="form-actions">
                <button
                  className="publish-button"
                  type="submit"
                  disabled={isPublishing}
                >
                  {isPublishing
                    ? "Saving..."
                    : editingPostId !== null
                      ? "Save changes"
                      : "Publish story"}
                  <span>{isPublishing ? "…" : "↗"}</span>
                </button>

                <button
                  className="cancel-button"
                  type="button"
                  onClick={closeEditor}
                  disabled={isPublishing}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="stories-section" id="articles">
          <div className="section-topline">
            <span className="section-kicker">THE STORY COLLECTION</span>
            <span className="live-count">
              <span /> {posts.length.toString().padStart(2, "0")} STORIES AND COUNTING
            </span>
          </div>

          <div className="stories-heading">
            <h2>Fresh from the <em>mind.</em></h2>
            <p>Good reads for the in-between moments.</p>
          </div>

          {notice && (
            <div className="notice-message" role="status">
              <span>✓</span> {notice}
              <button
                type="button"
                onClick={() => setNotice("")}
                aria-label="Dismiss message"
              >
                ×
              </button>
            </div>
          )}

          <div className="filter-row">
            <div className="category-filters">
              {categories.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={`filter-chip ${activeCategory === item ? "selected" : ""
                    }`}
                  onClick={() => setActiveCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <label className="search-box">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Find a story..."
                aria-label="Search stories"
              />
              <span className="search-shortcut">↵</span>
            </label>
          </div>

          {isLoading && (
            <p className="loading-message">Loading your stories...</p>
          )}

          {!isLoading &&
            activeCategory === "All stories" &&
            !search &&
            featuredPost && (
              <article className="featured-card">
                <div className={`featured-art art-${featuredPost.accent}`}>
                  <span className="featured-number">FEATURED STORY / 001</span>
                  <span className="featured-symbol">{featuredPost.symbol}</span>
                  <span className="featured-art-caption">
                    THE JOY OF FIGURING IT OUT
                  </span>
                  <span className="featured-orbit" />
                  <span className="featured-orbit orbit-small" />
                </div>

                <div className="featured-content">
                  <div className="featured-meta">
                    <span className="category-label">
                      {featuredPost.category}
                    </span>

                    <span>{featuredPost.readTime}</span>
                  </div>

                  <p className="story-author">
                    Written by{" "}
                    <strong>
                      {featuredPost.authorName || "Unknown author"}
                    </strong>
                  </p>

                  <h3>{featuredPost.title}</h3>
                  <p>{featuredPost.content}</p>

                  <a href="#story-list" className="read-link">
                    Explore the collection <span>↗</span>
                  </a>

                  <PostActions post={featuredPost} />

                  <LikeButton
                    postId={featuredPost.id}
                    currentUser={currentUser}
                    onRequestAuth={requestAuth}
                  />

                  <CommentsSection
                    postId={featuredPost.id}
                    currentUser={currentUser}
                    onRequestAuth={requestAuth}
                  />

                  <span className="featured-index">01 — 04</span>
                </div>
              </article>
            )}

          <div className="list-heading" id="story-list">
            <h3>
              {search || activeCategory !== "All stories"
                ? "Your results"
                : "More to explore"}
            </h3>
            <span>
              {filteredPosts.length}{" "}
              {filteredPosts.length === 1 ? "story" : "stories"}
            </span>
          </div>

          <div className="post-grid">
            {(activeCategory === "All stories" && !search
              ? remainingPosts
              : filteredPosts
            ).map((post, index) => (
              <article
                className={`post-card card-${post.accent}`}
                key={post.id}
                style={{ "--card-delay": `${index * 90}ms` }}
              >
                <div className={`card-art art-${post.accent}`}>
                  <span className="card-art-index">
                    NOTES / {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="card-art-symbol">{post.symbol}</span>
                  <span className="card-art-mark">✳</span>
                </div>

                <div className="post-card-content">
                  <div className="card-meta">
                    <span className="category-label">
                      {post.category || "Technology"}
                    </span>
                    <span>{post.readTime || "3 min read"}</span>
                  </div>

                  <h4>{post.title}</h4>
                  <p>{post.content}</p>

                  <p className="story-author">
                    Written by{" "}
                    <strong>{post.authorName || "Unknown author"}</strong>
                  </p>


                  <div className="card-footer">
                    <span>FROM THE BLOGSPACE JOURNAL</span>
                    <span className="card-arrow" aria-hidden="true">↗</span>
                  </div>

                  <PostActions post={post} />

                  <LikeButton
                    postId={post.id}
                    currentUser={currentUser}
                    onRequestAuth={requestAuth}
                  />

                  <CommentsSection
                    postId={post.id}
                    currentUser={currentUser}
                    onRequestAuth={requestAuth}
                  />
                </div>
              </article>
            ))}
          </div>

          {!isLoading && filteredPosts.length === 0 && (
            <div className="empty-state">
              <span>✳</span>
              <h3>No stories on this page yet.</h3>
              <p>Try a different search or choose another topic.</p>

              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setSearch("");
                  setActiveCategory("All stories");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        <section className="closing-banner" id="about">
          <span className="closing-star">✳</span>
          <span className="section-kicker">A NOTE TO THE CURIOUS</span>

          <h2>
            The world needs
            <br />
            more <em>good questions.</em>
          </h2>

          <p>Keep learning. Keep making. Keep sharing what you discover.</p>

          <button
            type="button"
            className="closing-button"
            onClick={() => {
              if (!currentUser) {
                requestAuth();
                return;
              }

              setEditingPostId(null);
              setTitle("");
              setCategory("Java");
              setContent("");
              setShowForm(true);

              window.setTimeout(() => {
                document.getElementById("editor")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }, 0);
            }}
          >
            Add your voice <span>↗</span>
          </button>
        </section>
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="#home">
          <span className="brand-icon">b.</span>
          <span>
            blogspace<span className="brand-period">.</span>
          </span>
        </a>

        <p>A small space for big ideas.</p>
        <a href="#home" className="back-top">BACK TO TOP ↑</a>
        <span className="copyright">MADE WITH CURIOSITY © 2026</span>
      </footer>
    </div>
  );
}

export default App;
