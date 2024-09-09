$(document).ready(function () {

    $("#result-img").attr("src", '').hide()


    $("#submit_meme_btn").click(function () {
        send_img_to_gpt()
    })

    function send_img_to_gpt() {
        $("#generated-caption").empty()
        $("#result-img").attr("src", '').hide()
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
                    $("#result-img").attr("src", response['file-path']).show()
                    $("#generated-caption").append(response["gpt-response"]);
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