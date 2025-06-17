document.addEventListener("DOMContentLoaded", function () {
    // Elements for Chatbot & Navbar
    const chatBox = document.getElementById("chat-box");
    const userInput = document.getElementById("user-input");
    const sendButton = document.getElementById("send-button");

    const navLinks = document.querySelectorAll(".navbar-nav .nav-link");
    const sections = document.querySelectorAll("section[id]"); // Sections for scrollspy
    const navbar = document.querySelector('.navbar.sticky-top'); // Target the main sticky navbar
    const navbarHeight = navbar ? navbar.offsetHeight : 70;

    const chatbotModalElement = document.getElementById('chatbotModal');
    const chatbotNavLink = document.querySelector('.nav-link[data-bs-target="#chatbotModal"], .nav-link[href="#chatbotModal"]');

    // Chat history array
    let chatHistory = [];
    const CHAT_HISTORY_KEY = 'mentalMateChatHistory_session'; // Changed key slightly for clarity, though not strictly necessary

    // --- Helper function to escape HTML ---
    function escapeHtml(text) {
        if (typeof text !== 'string') return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // --- Helper function to scroll chat to bottom ---
    function scrollChatToBottom() {
        if (chatBox) {
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }

    // --- Function to render a message to the DOM ---
    function renderMessageToDOM(sender, content, className, isMarkdown = false, isTyping = false) {
        if (!chatBox) return; 
        const messageElement = document.createElement("div");
        messageElement.className = className;

        const senderElement = document.createElement("strong");
        senderElement.textContent = sender + ":";

        const contentElement = document.createElement("span");
        if (isTyping) {
            // Special handling for typeText, content is the target element
            // typeText will populate this span
        } else {
            contentElement.innerHTML = isMarkdown && typeof marked !== 'undefined' ? (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(marked.parse(content)) : marked.parse(content)) : escapeHtml(content);
        }
        
        messageElement.appendChild(senderElement);
        messageElement.appendChild(document.createTextNode(" "));
        messageElement.appendChild(contentElement);

        chatBox.appendChild(messageElement);
        scrollChatToBottom();
        return contentElement; // Return contentElement for typeText
    }
    
    // --- Function to save chat history to sessionStorage ---
    function saveChatHistory() {
        try {
            sessionStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory));
        } catch (e) {
            console.error("Error saving chat history to sessionStorage:", e);
            // Optionally, inform the user that history might not be saved
        }
    }

    // --- Function to load chat history from sessionStorage ---
    function loadChatHistory() {
        if (!chatBox) return;
        try {
            const storedHistory = sessionStorage.getItem(CHAT_HISTORY_KEY);
            if (storedHistory) {
                chatHistory = JSON.parse(storedHistory);
                chatHistory.forEach(msg => {
                    renderMessageToDOM(msg.sender, msg.content, msg.className, msg.isMarkdown);
                });
            }
        } catch (e) {
            console.error("Error loading chat history from sessionStorage:", e);
            chatHistory = []; // Reset history if loading fails
        }
        scrollChatToBottom();
    }
    
    // --- Function to add a message to history, save, and render ---
    function addMessageToChat(sender, content, className, isMarkdown = false, isAI = false) {
        const messageData = { sender, content, className, isMarkdown };
        
        if (!isAI) { 
            chatHistory.push(messageData);
            saveChatHistory();
            renderMessageToDOM(sender, content, className, isMarkdown);
        } else {
            const contentElement = renderMessageToDOM(sender, "", className, isMarkdown, true); 
            typeText(contentElement, content, 10, () => {
                const finalMessageData = { sender, content, className, isMarkdown };
                chatHistory.push(finalMessageData);
                saveChatHistory();
            });
        }
    }


    // --- Function to simulate typing text effect ---
    function typeText(element, text, speed = 10, onCompleteCallback) {
        const isMarkdownContent = element.closest('.ai-message') !== null; 
        const html = isMarkdownContent && typeof marked !== 'undefined' ? (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(marked.parse(text)) : marked.parse(text)) : escapeHtml(text);

        let i = 0;
        function typeChar() {
            if (i < html.length) {
                element.innerHTML = html.substring(0, i + 1); 
                scrollChatToBottom();
                i++;
                setTimeout(typeChar, speed);
            } else {
                element.innerHTML = html; 
                scrollChatToBottom();
                if (onCompleteCallback) {
                    onCompleteCallback();
                }
            }
        }
        typeChar();
    }

    // --- Function to fetch AI response ---
    function fetchAIResponse(message) {
        if (!chatBox) return; 
        const loadingMsg = document.createElement("div");
        loadingMsg.className = "chat-message ai-message";
        const loadingSender = document.createElement("strong");
        loadingSender.textContent = "MentalMate:";
        const loadingDots = document.createElement("div");
        loadingDots.className = "loading-dots"; 
        loadingDots.innerHTML = "<span></span><span></span><span></span>";
        loadingMsg.appendChild(loadingSender);
        loadingMsg.appendChild(document.createTextNode(" "));
        loadingMsg.appendChild(loadingDots);
        chatBox.appendChild(loadingMsg);
        scrollChatToBottom();

        fetch("/generate", { 
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" }, 
            body: `user_input=${encodeURIComponent(message)}` 
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            if (chatBox.contains(loadingMsg)) {
                chatBox.removeChild(loadingMsg);
            }
            const cleanedResponse = data.response; 
            addMessageToChat("MentalMate", cleanedResponse, "chat-message ai-message", true, true); 
        })
        .catch(err => {
            if (chatBox.contains(loadingMsg)) {
                chatBox.removeChild(loadingMsg);
            }
            addMessageToChat("MentalMate", "Maaf, terjadi kesalahan. Silakan coba lagi nanti.", "chat-message ai-message error-message", false);
            console.error("Error fetching AI response:", err);
        });
    }

    // --- Function to send a message ---
    function sendMessage() {
        if (!userInput || !chatBox) return; 
        const message = userInput.value.trim();
        if (message === "") return;

        addMessageToChat("Kamu", message, "chat-message user-message", false); 

        userInput.value = ""; 
        if (userInput.tagName === 'TEXTAREA') {
            userInput.style.height = "auto";
            userInput.style.overflowY = "hidden";
        }
        fetchAIResponse(message); 
    }

    // --- Chatbot Event Listeners ---
    if (sendButton) {
        sendButton.addEventListener("click", sendMessage);
    }
    if (userInput) {
        userInput.addEventListener("keydown", function(e) {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault(); 
                sendMessage();
            }
        });
        if (userInput.tagName === 'TEXTAREA') {
            userInput.addEventListener("input", function() {
                userInput.style.height = "auto"; 
                let scrollHeight = userInput.scrollHeight;
                const maxHeight = parseInt(window.getComputedStyle(userInput).lineHeight) * 4; 
                if (scrollHeight > maxHeight) {
                    userInput.style.height = maxHeight + "px";
                    userInput.style.overflowY = "auto";
                } else {
                    userInput.style.height = scrollHeight + "px";
                    userInput.style.overflowY = "hidden";
                }
            });
        }
    }
    
    if (chatBox) { 
        loadChatHistory();
    }

    function updateActiveNavLink() {
        const chatbotModalIsOpen = chatbotModalElement && chatbotModalElement.classList.contains('show');

        if (chatbotModalIsOpen && chatbotNavLink) {
            navLinks.forEach(nav => nav.classList.remove('active'));
            chatbotNavLink.classList.add('active');
            return;
        }

        if (sections.length > 0 && (window.location.pathname === '/' || window.location.pathname.endsWith('index.html'))) {
            changeNavOnScroll(); 
        } else {
            let pageLinkActivated = false;
            navLinks.forEach(link => {
                if (link === chatbotNavLink) { 
                    link.classList.remove('active'); 
                    return;
                }
                const linkUrl = new URL(link.href, window.location.origin);
                const currentUrl = new URL(window.location.href, window.location.origin);
                if (linkUrl.pathname === currentUrl.pathname && !link.hash && !link.getAttribute('data-bs-toggle')) {
                    navLinks.forEach(nav => { if (nav !== chatbotNavLink) nav.classList.remove('active'); });
                    link.classList.add('active');
                    pageLinkActivated = true;
                }
            });
            if (!pageLinkActivated && (window.location.pathname === '/' || window.location.pathname.endsWith('index.html'))) {
                const homeLink = document.querySelector('.navbar-nav .nav-link[href="#home"]');
                if (homeLink && !homeLink.getAttribute('data-bs-toggle') && homeLink !== chatbotNavLink) {
                    navLinks.forEach(nav => {
                        if (nav !== homeLink && nav !== chatbotNavLink) {
                            nav.classList.remove('active');
                        }
                    });
                    homeLink.classList.add('active');
                }
            }
        }
    }

    function changeNavOnScroll() {
        if (chatbotModalElement && chatbotModalElement.classList.contains('show') && chatbotNavLink) {
            navLinks.forEach(nav => {
                if (nav !== chatbotNavLink) nav.classList.remove('active');
            });
            if (chatbotNavLink && !chatbotNavLink.classList.contains('active')) chatbotNavLink.classList.add('active');
            return;
        }

        let currentSectionId = "";
        let bottomPage = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 2; 

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (pageYOffset >= sectionTop - navbarHeight - 20 && pageYOffset < sectionTop + sectionHeight - navbarHeight - 20) {
                 currentSectionId = section.getAttribute("id");
            }
        });
        
        if (bottomPage && sections.length > 0) {
            const lastSection = sections[sections.length - 1];
            const lastSectionTop = lastSection.offsetTop;
            if (pageYOffset + window.innerHeight > lastSectionTop - navbarHeight - 20) { 
                 currentSectionId = lastSection.getAttribute("id");
            }
        }

        let activeLinkSetByScroll = false;
        navLinks.forEach(link => {
            if (link === chatbotNavLink) return; 
            link.classList.remove("active");
            if (link.hash && link.hash.substring(1) === currentSectionId) {
                link.classList.add("active");
                activeLinkSetByScroll = true;
            }
        });

        if (!activeLinkSetByScroll && (window.location.pathname === '/' || window.location.pathname.endsWith('index.html'))) {
            const homeLink = document.querySelector('.navbar-nav .nav-link[href="#home"]');
            if (homeLink && !homeLink.getAttribute('data-bs-toggle') && homeLink !== chatbotNavLink) {
                let anotherLinkIsActive = false;
                navLinks.forEach(nav => {
                    if (nav.classList.contains('active') && nav !== homeLink && nav !== chatbotNavLink) {
                        anotherLinkIsActive = true;
                    }
                });
                if (!anotherLinkIsActive) {
                    navLinks.forEach(nav => {
                        if (nav !== homeLink && nav !== chatbotNavLink) {
                           nav.classList.remove('active');
                        }
                    });
                    homeLink.classList.add('active');
                }
            }
        }
    }

    if (chatbotModalElement && chatbotNavLink) {
        chatbotModalElement.addEventListener('shown.bs.modal', () => {
            if (chatBox && chatBox.innerHTML === '' && chatHistory.length > 0) {
                 chatHistory.forEach(msg => {
                    renderMessageToDOM(msg.sender, msg.content, msg.className, msg.isMarkdown);
                });
            }
            navLinks.forEach(nav => {
                if (nav !== chatbotNavLink) {
                    nav.classList.remove('active');
                }
            });
            chatbotNavLink.classList.add('active');
            scrollChatToBottom(); 
            const modalChatInput = chatbotModalElement.querySelector('#user-input') || chatbotModalElement.querySelector('.chat-input');
            if (modalChatInput) {
                modalChatInput.focus();
            } else if (userInput) { 
                userInput.focus(); 
            }
        });
        chatbotModalElement.addEventListener('hidden.bs.modal', () => {
            if (chatbotNavLink) {
                chatbotNavLink.classList.remove('active');
            }
            updateActiveNavLink(); 
        });
    }

    navLinks.forEach(link => {
        link.addEventListener("click", function (e) {
            const isChatbotTrigger = (chatbotNavLink && this === chatbotNavLink) || this.getAttribute('data-bs-target') === '#chatbotModal';
            if (isChatbotTrigger) {
                return;
            }
            const linkUrl = new URL(this.href, window.location.origin);
            if (this.hash !== "" && document.querySelector(this.hash) && linkUrl.pathname === window.location.pathname) {
                e.preventDefault();
                const targetElement = document.querySelector(this.hash);
                if (targetElement) {
                    const elementPosition = targetElement.offsetTop;
                    window.scrollTo({
                        top: elementPosition - navbarHeight,
                        behavior: "smooth"
                    });
                }
            }
        });
    });

    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function () {
            this.blur();
        });
    });

    if (sections.length > 0 && (window.location.pathname === '/' || window.location.pathname.endsWith('index.html'))) {
        window.addEventListener("scroll", changeNavOnScroll);
    }
    updateActiveNavLink(); 

    window.addEventListener('scroll', function() {
      if (navbar) { 
        if (window.scrollY > 50) {
          navbar.classList.add('shadow-sm');
        } else {
          navbar.classList.remove('shadow-sm');
        }
      }
    });
});
