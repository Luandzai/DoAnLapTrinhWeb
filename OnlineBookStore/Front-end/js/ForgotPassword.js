document.getElementById("forgot-password-form").addEventListener("submit", function(event) {
    event.preventDefault();

    var emailOrPhone = document.getElementById("emailOrPhone").value;


    if (!emailOrPhone) {
        alert("Please enter your email or phone number.");
        return;
    }


    fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: emailOrPhone,
            phone: emailOrPhone
        })
    })
    .then(response => response.json())
    .then(data => {
        alert("A reset password link has been sent to your email.");
    })
    .catch(error => {
        console.error('Error:', error);
        alert("Something went wrong! Please try again.");
    });
});
