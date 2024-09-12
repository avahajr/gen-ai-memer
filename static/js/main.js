$(document).ready(function () {
        $("#generated-meme").hide()
        $("#result-img").attr("src", '').hide()

        let spinner = $("#spinner-div")
        let spinner_desc = $("#spinner-desc")
        let feedback = $("#feedback")
        let placeholder = $("#result-placeholder")
        let result = $("#result-card")

        result.hide()
        feedback.hide()


        $("#submit_caption_btn").click(function () {
            get_image_from_caption()
        })

        $("#caption_input").on("keypress", function (event) {
            if (event.keyCode == 13) {
                get_image_from_caption()
            }
        })

        $("#refine-button").click(function () {
            refine_meme()
        })

        $("#meme-refiner").on("keypress", function (event) {
            if (event.keyCode === 13) {
                refine_meme()
            }
        })

        function get_image_from_caption() {
            $("#generated-meme").hide()
            $("#provided-caption").text("")
            let caption_input_element = $("#caption_input")
            let caption = caption_input_element.val().trim(); // Trim to remove extra spaces

            if (caption === "") {
                console.log("Caption is empty!");
                alert("Please enter a caption to generate a meme.");
                return;
            }

            spinner.show()
            spinner_desc.text("generating image...")

            $.ajax({
                url: '/add_meme', method: 'POST', contentType: 'application/json',  // Specify JSON content type
                data: JSON.stringify({caption: caption}),  // Convert data to JSON string
                success: function (response) {
                    console.log("got response", response)
                    $("#generated-meme").attr("src", response["image_url"]).show()
                    $("#provided-caption").append(caption)
                    spinner.hide()
                    result.show()
                    feedback.show()
                    placeholder.hide()
                    caption_input_element.val("")
                }, error: function (xhr, status, error) {
                    console.log(xhr.responseText)
                    spinner.hide()
                    feedback.show()
                }
            })

        }

        function refine_meme() {
            let img_url = $("#generated-meme").attr("src")
            let provided_caption = $("#provided-caption").text()

            let meme_refiner_input_element = $("#meme-refiner")
            let meme_refine_input = meme_refiner_input_element.val()

            spinner.show()
            spinner_desc.text("refining image...")
            console.log("sending over:", JSON.stringify({
                img_url: img_url,
                provided_caption: provided_caption,
                meme_refine_input: meme_refine_input
            }))


            $.ajax({
                url: "/refine_image",
                method: "PUT",
                contentType: 'application/json',
                data: JSON.stringify({
                    img_url: img_url,
                    provided_caption: provided_caption,
                    meme_refine_input: meme_refine_input
                }),
                success: function (image_response) {
                    console.log("got image response", image_response)
                    console.log("generating new caption...")
                    spinner_desc.text("refining caption...")
                    $("#generated-meme").attr("src", image_response["image_url"]).show()
                    meme_refiner_input_element.val("")
                    $.ajax({
                        url: "/refine_caption",
                        method: "POST",
                        contentType: 'application/json',
                        data: JSON.stringify(image_response),
                        success: function (caption_response) {
                            console.log("got caption response", caption_response)
                            $("#provided-caption").text(caption_response["caption"]).show()
                            spinner.hide()
                            result.show()
                            feedback.show()
                            placeholder.hide()
                        }
                    })
                },
                error: function (xhr, status, error) {
                    console.log(xhr.responseText)
                    spinner.hide()
                    feedback.show()
                }
            })
        }

        $("#submit_meme_btn").click(function () {
            get_caption_from_image()
        })

        function get_caption_from_image() {
            $("#generated-caption").empty()
            $("#result-img").attr("src", '').hide()
            spinner.show()
            let image = $("#image_input")[0].files[0]
            if (image) {
                let formData = new FormData();
                formData.append("image", image); // Append the file to FormData
                $.ajax({
                    url: "/add_meme",
                    type: "POST",
                    data: formData,
                    contentType: false,
                    processData: false,
                    success: function (response) {
                        console.log(response);
                        $("#result-img").attr("src", response['file-path']).show()
                        $("#generated-caption").text(response["gpt-response"]);
                        placeholder.hide()
                        spinner.hide()
                        result.show()
                        feedback.show()
                    },
                    error: function (xhr, status, error) {
                        console.error(xhr.responseText);
                        spinner.hide()
                    }
                });
            } else {
                console.error("No file selected.");
                spinner.hide()

            }
        }

    }
)