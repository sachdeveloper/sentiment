window.onload = function() {
    var password = prompt("Please enter the password to access this page", "");
    if (password != "banker") {
        alert('Incorrect password!');
        window.location.href = "/";  // Redirect to the home page
    }
}
