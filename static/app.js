var socket = io.connect();
var userId = null;

function handleSubmit() {
    var name = document.getElementById('name').value;
    var team = document.querySelector('input[name="team"]:checked').value;

    fetch('/submit', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: `name=${name}&team=${team}`
    }).then(response => response.json()).then(data => {
        userId = data.id;
        document.getElementById('input-form').style.display = 'none';
        document.getElementById('color-boxes').style.display = 'flex';
        document.getElementById('current-color-container').style.display = 'block'; // Show current color selection
    });
}


function handleColor(color) {
    var actualColor = color;

    // Clear previous selection
    const colorDivs = document.querySelectorAll('#color-boxes div');
    colorDivs.forEach(div => div.style.outline = 'none');

    // Outline the selected color
    const colorDiv = Array.from(colorDivs).find(div => div.style.backgroundColor === actualColor);
    if (colorDiv) {
        colorDiv.style.outline = '2px solid black';
    }

    // Convert color to RGB if it's green
    if (color === 'green') {
        actualColor = 'rgb(0, 255, 0)';
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
        // Add 'E' for "Group Case"
        for (const team of ['A', 'B', 'C', 'D', 'E']) { 
            const userList = document.querySelector(`#team-${team} .team-list`);
            userList.innerHTML = ''; // clear out the old users
            for (const user of data.users.filter(u => u.team === team)) {
                const li = document.createElement('li');
                const userName = document.createElement('div');
                userName.textContent = user.name;
                userName.className = 'user-color';
                userName.style.backgroundColor = user.color;

                // Add event listener
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
            document.body.style.backgroundColor = `rgb(${avgR},${avgG},${avgB})`; // change here
        } else {
            document.body.style.backgroundColor = '#007BFF'; // set to default blue when no users
        }
    });
}

// A helper function to convert the rgb color string to an object with r, g, b properties
function getRGB(color) {
    const rgb = color.match(/\d+/g);
    return {
        r: parseInt(rgb[0]),
        g: parseInt(rgb[1]),
        b: parseInt(rgb[2])
    };
}


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


if (document.getElementById('team-A') || document.getElementById('team-B') || document.getElementById('team-C') || document.getElementById('team-D') || document.getElementById('team-E')) {
    loadUsers();
}

document.getElementById('clear-btn').addEventListener('click', function() {
    fetch('/clear', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
    }).then(response => response.json()).then(data => {
        if (data.success) {
            loadUsers();  // refresh the user list after clearing
            document.body.style.backgroundColor = '#007BFF'; // clear the average color
            alert('All colors cleared successfully!');
        } else {
            alert('There was an error clearing the colors.');
        }        
    });
});

socket.on('color change', function (data) {
    if (data.id === userId) {
        // If the user's color has been cleared, update their current color selection
        if (data.color === null || data.color === 'white') {
            document.getElementById('current-color').style.backgroundColor = 'white';
            document.getElementById('current-color-text').innerText = 'No color selected';
        } else {
            document.getElementById('current-color').style.backgroundColor = data.color;
            document.getElementById('current-color-text').innerText = data.color;
        }
    }
    if (document.getElementById('team-A') || document.getElementById('team-B') || document.getElementById('team-C') || document.getElementById('team-D')) {
        loadUsers();
    }
});

socket.on('clear color', function (data) {
    if (data.id === userId) {
        document.getElementById('current-color').style.backgroundColor = 'white';
        document.getElementById('current-color-text').innerText = 'No color selected';
    }
});


