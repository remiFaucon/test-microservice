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
        for(let i=0; i<files_obj.length; i++) {
            form_data.append(i.toString(), files_obj[i]);
        }
        const xhttp = new XMLHttpRequest();
        xhttp.open("POST", route, true);
        xhttp.onload = function(event) {
            if (xhttp.status === 200) {
                alert(this.responseText);
            } else {
                alert("Error " + xhttp.status + " occurred when trying to upload your file.");
            }
        }

        xhttp.send(form_data);
    }
}