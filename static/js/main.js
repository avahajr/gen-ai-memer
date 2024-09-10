$(document).ready(function () {
    $("#generated-meme").hide()
    $("#result-img").attr("src", '').hide()

    $("#submit_caption_btn").click(function () {
        get_image_from_caption()
    })

    function get_image_from_caption() {
        $("#generated-meme").hide()
        let caption = $("#caption_input").val()
        $.ajax({
            url: '/get_meme_from_caption',
            method: 'POST',
            contentType: 'application/json',  // Specify JSON content type
            data: JSON.stringify({caption: caption}),  // Convert data to JSON string
            success: function (response) {
                console.log("got response", response)
            },
            error: function (xhr, status, error) {
                console.log(xhr.responseText)
            }
        })

    }

    $("#submit_meme_btn").click(function () {
        get_caption_from_image()
    })

    function get_caption_from_image() {
        $("#generated-caption").empty()
        $("#result-img").attr("src", '').hide()
        let image = $("#image_input")[0].files[0]
        if (image) {
            let formData = new FormData();
            formData.append("image", image); // Append the file to FormData
            $.ajax({
                url: "/upload_image_for_captioning",
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