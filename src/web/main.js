async function fetchUsers() {
  try {
    const response = await fetch("/api/users");
    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }
    const data = await response.json();
    return data.users;
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

function populateUserList(users) {
  const userList = document.getElementById("userList");
  userList.innerHTML = "";

  Object.keys(users).forEach((userId) => {
    const user = users[userId];
    const li = document.createElement("li");
    li.textContent = user.ProfileName;
    li.setAttribute("data-id", userId);

    li.addEventListener("click", async () => {
      await loadChat(user);
    });

    userList.appendChild(li);
  });
}

async function fetchChatData(userid) {
  try {
    const response = await fetch(`/api/user/${userid}`);
    if (!response.ok) {
      throw new Error("Failed to fetch chat data");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching chat data:", error);
  }
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function loadMessages(messages) {
  const chatWindow = document.getElementById("chatWindow");
  chatWindow.innerHTML = "";

  messages.forEach((msg) => {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");

    if (msg.customerMessage) {
      messageElement.classList.add("customer-message");
    } else {
      messageElement.classList.add("operator-message");
    }

    messageElement.innerHTML = `
          <div>${msg.message}</div>
          <div class="message-time">${formatTime(msg.time)}</div>
      `;

    chatWindow.appendChild(messageElement);
  });

  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Fetch AI responses after loading messages with a delay
  setTimeout(fetchAiResponses, 500);
}

async function loadChat(user) {
  const profileName = document.getElementById("profileName");
  const messageInput = document.getElementById("messageInput");
  const sendMessageButton = document.getElementById("sendMessageButton");

  profileName.textContent = `Chat with ${user.ProfileName}`;
  messageInput.disabled = false;
  sendMessageButton.disabled = false;

  chatData = await fetchChatData(user.PhoneNumber);
  if (chatData) {
    messages = chatData.Messages;
    loadMessages(messages);
    pollChatData(user.PhoneNumber);
  }
}

async function pollUsers() {
  let previousUsers = {};

  setInterval(async () => {
    const newUsers = await fetchUsers();
    if (newUsers) {
      if (JSON.stringify(newUsers) !== JSON.stringify(previousUsers)) {
        previousUsers = newUsers;
        populateUserList(newUsers);
      }
    }
  }, 1000);
}

async function pollChatData(userid) {
  setInterval(async () => {
    const newChatData = await fetchChatData(userid);
    if (newChatData) {
      const newMessages = newChatData.Messages;
      if (JSON.stringify(newMessages) !== JSON.stringify(messages)) {
        messages = newMessages;
        loadMessages(messages);
      }
    }
  }, 1000);
}

async function sendMessage() {
  const messageInput = document.getElementById("messageInput");
  const messageText = messageInput.value.trim();

  if (!messageText) {
    return;
  }

  const newMessage = {
    message: messageText,
    time: Date.now(),
    customerMessage: false,
  };

  try {
    const userPhoneNumber = chatData.PhoneNumber;
    const response = await fetch(`/api/message/send/${userPhoneNumber}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newMessage),
    });

    if (!response.ok) {
      throw new Error("Failed to send message");
    }

    messages.push(newMessage);
    loadMessages(messages);
    messageInput.value = "";
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

async function fetchAiResponses() {
  try {
    const userPhoneNumber = chatData.PhoneNumber;
    const aiResponsesContainer = document.getElementById("aiResponses");
    aiResponsesContainer.innerHTML = "";

    const aiPromises = [1, 2, 3].map(() =>
      fetch(`/api/ai/${userPhoneNumber}`)
        .then((response) => response.text())
        .then((data) => {
          if (data && data != `""` && data != `"`) {
            const aiResponseElement = document.createElement("div");
            aiResponseElement.classList.add("ai-response");
            aiResponseElement.textContent = data;

            aiResponseElement.addEventListener("click", () => {
              document.getElementById("messageInput").value = data;
            });

            aiResponsesContainer.appendChild(aiResponseElement);
          }
        })
        .catch((error) => {
          console.error("Error fetching AI response:", error);
        })
    );

    // Load each AI response as they become available
    await Promise.all(aiPromises);

    if (!aiResponsesContainer.hasChildNodes()) {
      aiResponsesContainer.innerHTML = "No AI responses available.";
    }
  } catch (error) {
    console.error("Error fetching AI responses:", error);
    document.getElementById("aiResponses").innerHTML =
      "Failed to load AI responses.";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const users = await fetchUsers();
  if (users) {
    populateUserList(users);
    pollUsers();
  }

  // Send message on ENTER key press
  document
    .getElementById("messageInput")
    .addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        sendMessage();
      }
    });

  document.getElementById("sendMessageButton").addEventListener("click", () => {
    sendMessage();
  });
  // Refresh AI responses when the button is clicked
  document
    .getElementById("refreshAiButton")
    .addEventListener("click", fetchAiResponses);
});
