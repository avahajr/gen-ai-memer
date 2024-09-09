$(document).ready(function () {

    $("#submit_meme_btn").click(function () {
        send_img_to_gpt()
    })

    function send_img_to_gpt() {
        let image = $("#image_input")[0].files[0]
        if (image) {
            let formData = new FormData();
            formData.append("image", image); // Append the file to FormData

            $.ajax({
                url: "/upload_image",
                type: "POST",
                data: formData,
                contentType: false,
                processData: false,
                success: function (response) {
                    console.log(response);
                },
                error: function (xhr, status, error) {
                    console.error(xhr.responseText);
                }
            });
        } else {
            console.error("No file selected.");
        }
    }

})