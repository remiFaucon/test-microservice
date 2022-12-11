function upload_file(e) {
    e.preventDefault();
    ajax_file_upload(e.dataTransfer.files, "/");
}

function file_explorer() {
    document.getElementById('selectfile').click();
    document.getElementById('selectfile').onchange = function() {
        files = document.getElementById('selectfile').files;
        ajax_file_upload(files, "/");
    };
}

function ajax_file_upload(files_obj, route) {
    if(files_obj !== undefined) {
        const form_data = new FormData();
        //for(let i=0; i<files_obj.length; i++) {
        console.log(files_obj)
            form_data.append("0", files_obj[0]);
        // }
        const xhttp = new XMLHttpRequest();
        xhttp.open("POST", route, true);
        xhttp.onload = function(event) {
            if (xhttp.status === 200) {
                console.log(this.responseText);
            } else {
                alert("Error " + xhttp.status + " occurred when trying to upload your file.");
            }
        }

        xhttp.send(form_data);
    }
}