// Initialize set to store unique usernames
let userSet = new Set();
let activeUser = '';

// Function to sanitize user input
function sanitize(input) {
    const element = document.createElement('div');
    element.innerText = input;
    return element.innerHTML;
}

// Function to replace text emoticons with emojis
function replaceEmoticons(text) {
    return text
        .replace(/:\)/g, '😊')
        .replace(/:\(/g, '😢')
        .replace(/:D/g, '😃')
        .replace(/<3/g, '❤️');
}

// Function to update the active user list
function updateUserList() {
    const userList = document.getElementById('userList');
    userList.innerHTML = '';
    userSet.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user;
        userList.appendChild(li);
    });
}

// Ensure DOM is fully loaded before executing the script
document.addEventListener('DOMContentLoaded', function() {
    const socket = io();

    // Handle the submission of the username form
    document.getElementById('usernameForm').onsubmit = function(event) {
        event.preventDefault();
        const username = document.getElementById('usernameInput').value.trim();

        // Check if the username already exists
        if (userSet.has(username)) {
            document.getElementById('usernameError').textContent = 'Username is taken. Try another one.';
        } else {
            userSet.add(username);
            activeUser = username;
            document.getElementById('usernameError').textContent = ''; // Clear error message
            document.getElementById('usernameSection').style.display = 'none';
            document.getElementById('chatSection').style.display = 'block';
            socket.emit('join', username); // Notify the server of the new user

            // No need to add the system message here; it will be handled by the server
        }
    };

    // Handle the submission of the chat message form
    document.getElementById('chatForm').onsubmit = function(event) {
        event.preventDefault();
        const messageInput = document.getElementById('chat-input');

        if (messageInput.value.trim() !== '') {
            let message = sanitize(messageInput.value);
            message = replaceEmoticons(message); // Replace emoticons with emojis
            socket.emit('message', message); // Send the message to the server
            messageInput.value = ''; // Clear the input after sending the message
        }
    };

    // Add event listener for typing indicator
    document.getElementById('chat-input').addEventListener('input', () => {
        socket.emit('typing', activeUser);
    });

    // Listen for typing events from the server
    socket.on('typing', (username) => {
        const typingIndicator = document.getElementById('typingIndicator');
        typingIndicator.innerHTML = `<p>${username} is typing...</p>`;
        setTimeout(() => { typingIndicator.innerHTML = ''; }, 3000);
    });

    // Handle receiving a new user joining the chat
    socket.on('userJoined', function(msg) {
        console.log('User joined:', msg);
        const username = msg.split(' ')[0];
        userSet.add(username);
        updateUserList(); // Update the list of active users
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-joined-message';  // Use the new CSS class here
        messageElement.innerHTML = `<strong>System:</strong> ${msg}`;
        document.getElementById('chatBox').appendChild(messageElement);
        document.getElementById('chatBox').scrollTop = document.getElementById('chatBox').scrollHeight;
    });

    // Handle receiving a new message
    socket.on('message', function(data) {
        console.log('Received message:', data);
        const messageElement = document.createElement('div');
        
        // Check if the message is from the active user
        if (data.username === activeUser) {
            messageElement.className = 'message user-message';  // Add user-message class
        } else {
            messageElement.className = 'message other-message'; // Add other-message class
        }

        messageElement.innerHTML = `<p><strong>${sanitize(data.username)}:</strong> ${sanitize(data.text)} <span class="timestamp">${new Date().toLocaleTimeString()}</span></p>`;
        document.getElementById('chatBox').appendChild(messageElement);
        document.getElementById('chatBox').scrollTop = document.getElementById('chatBox').scrollHeight;
    });

    // Handle a user leaving the chat
    socket.on('userLeft', function(msg) {
        console.log('User left:', msg);
        const username = msg.split(' ')[0];
        userSet.delete(username);
        updateUserList(); // Update the list of active users
        const messageElement = document.createElement('div');
        messageElement.className = 'message other-message';
        messageElement.innerHTML = `<strong>System:</strong> ${msg}`;
        document.getElementById('chatBox').appendChild(messageElement);
        document.getElementById('chatBox').scrollTop = document.getElementById('chatBox').scrollHeight;
    });

    // Handle server-side error (e.g., username already taken)
    socket.on('error', function(message) {
        document.getElementById('usernameError').textContent = message;
    });
});
