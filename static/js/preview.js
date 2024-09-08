$(document).ready(function () {
    function previewImage(file) {
        if (file) {
            var reader = new FileReader();

            reader.onload = function (e) {
                // Show the preview container
                $('#preview-container').removeClass('d-none');

                // Update the image source to the uploaded file
                $('#preview-image').attr('src', e.target.result);
            };

            // Read the file as a data URL
            reader.readAsDataURL(file);
        } else {
            // Hide the preview container if no file is selected
            $('#preview-container').addClass('d-none');
        }
    }

    // Event handler for when a new file is selected
    $('#image_input').on('change', function (event) {
        var file = event.target.files[0];
        previewImage(file);
    });

    // Check if there's already a file selected when the page loads
    var existingFile = $('#image_input')[0].files[0];
    previewImage(existingFile);
});
