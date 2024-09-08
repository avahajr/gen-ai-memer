$(document).ready(function () {

    $("#submit_meme_btn").click(function () {
        console.log("Generate caption from meme...")
        $("#spinner-div").show()
        if ($("#image_input").val() == null) {
            alert("there is no image!")
        }
    })

    function send_img_to_gpt(){
        return
    }

})