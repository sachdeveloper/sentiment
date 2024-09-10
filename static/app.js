var socket = io.connect();
var userId = localStorage.getItem('userId'); // Get userId from localStorage

function handleSubmit() {
    var name = document.getElementById('name').value;
    var team = document.querySelector('input[name="team"]:checked').value;

    fetch('/submit', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: `name=${name}&team=${team}`
    }).then(response => response.json()).then(data => {
        userId = data.id;
        localStorage.setItem('userId', userId);  // Store userId in localStorage
        document.getElementById('input-form').style.display = 'none';
        document.getElementById('color-boxes').style.display = 'flex';
        document.getElementById('current-color-container').style.display = 'block';
    });
}

function handleColor(color) {
    var actualColor = color;

    // Clear previous selection
    const colorDivs = document.querySelectorAll('#color-boxes .color-option');  // changed selector to directly select color-option
    colorDivs.forEach(div => {
        div.style.outline = 'none';  // Using outline to not affect layout.
        div.style.border = '2px solid transparent';  // Resetting border back to transparent for all color options
    });

    // Outline the selected color
    const colorDiv = Array.from(colorDivs).find(div => div.style.backgroundColor === actualColor);
    if (colorDiv) {
        colorDiv.style.border = '2px solid black';  // Setting border to black for selected color
    }

    fetch('/color', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: `id=${userId}&color=${actualColor}`
    }).then(response => response.json()).then(data => {
        if (!data.success) {
            alert('There was an error setting the color.');
        }
    });
}

function loadUsers() {
    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    let count = 0;

    fetch('/get_users', {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
    }).then(response => response.json()).then(data => {
        for (const team of ['A', 'B', 'C', 'D', 'E']) {
            const userList = document.querySelector(`#team-${team} .team-list`);
            userList.innerHTML = ''; // clear out the old users
            for (const user of data.users.filter(u => u.team === team)) {
                const li = document.createElement('li');
                const userName = document.createElement('div');
                userName.textContent = user.name;
                userName.className = 'user-color';
                userName.style.backgroundColor = user.color;

                // Add event listener for deleting a user
                userName.addEventListener('click', function() {
                    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
                        fetch('/delete_user', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                            body: `id=${user.id}`
                        }).then(response => response.json()).then(data => {
                            if (data.success) {
                                loadUsers();  // refresh the user list after deleting a user
                            } else {
                                alert('There was an error deleting the user.');
                            }
                        });
                    }
                });

                li.appendChild(userName);
                userList.appendChild(li);

                // Accumulate the RGB values
                if (user.color) {
                    const rgb = getRGB(user.color);
                    totalR += rgb.r;
                    totalG += rgb.g;
                    totalB += rgb.b;
                    count += 1;
                }
            }
        }

        // Set the average color
        if (count > 0) {
            const avgR = Math.round(totalR / count);
            const avgG = Math.round(totalG / count);
            const avgB = Math.round(totalB / count);
            document.body.style.backgroundColor = `rgb(${avgR},${avgG},${avgB})`;
        } else {
            document.body.style.backgroundColor = '#007BFF';
        }
    });
}

// Handle clearing the userId when the user is deleted by an admin
socket.on('user_deleted', function(data) {
    if (data.id === userId) {
        alert('You have been removed by the admin.');
        localStorage.removeItem('userId');  // Clear userId from localStorage
        window.location.reload();  // Force a page reload to show the login form again
    }
});

// A helper function to convert the rgb color string to an object with r, g, b properties
function getRGB(color) {
    const rgb = color.match(/\d+/g);
    return {
        r: parseInt(rgb[0]),
        g: parseInt(rgb[1]),
        b: parseInt(rgb[2])
    };
}

// When the page loads, check if userId exists in localStorage
window.onload = function() {
    if (userId) {
        document.getElementById('input-form').style.display = 'none';
        document.getElementById('color-boxes').style.display = 'flex';
        document.getElementById('current-color-container').style.display = 'block';
    }
};

document.getElementById('delete-all-btn').addEventListener('click', function() {
    if (confirm('Are you sure you want to delete all users?')) {
        fetch('/delete_all_users', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
        }).then(response => response.json()).then(data => {
            if (data.success) {
                loadUsers();  // refresh the user list after deleting all users
                document.body.style.backgroundColor = '#007BFF'; // clear the average color
            } else {
                alert('There was an error clearing all users.');
            }
        });
    }
});
