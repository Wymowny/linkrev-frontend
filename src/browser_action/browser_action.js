"use strict";

function localizeHtmlPage() {
    var objects = document.getElementsByTagName('html');

    for (var j = 0; j < objects.length; j++) {
        var obj = objects[j];
        var valStrH = obj.innerHTML.toString();
        var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function(match, v1) {
            return v1 ? chrome.i18n.getMessage(v1) : "";
        });

        if(valNewH != valStrH) {
            obj.innerHTML = valNewH;
        }
    }
}

localizeHtmlPage();

window.onload = function() {
    GetExistingComments();
};

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("submitButton").addEventListener("click", sendComment);
    document.getElementById("plusForComment").addEventListener("click", plusComment);
    document.getElementById("minusForComment").addEventListener("click", minusComment);
    document.getElementById("reportComment").addEventListener("click", reportComment);
});

function GetExistingComments() {
    getCurrentUrl(ExistingCommentsAjaxQuery);
}

function ExistingCommentsAjaxQuery(url) {
    var xhr = new XMLHttpRequest();
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState != 4) {
            return;
        }

        if (this.responseText) {
            var existingComments = document.getElementById("commeasdants");
            var comments = JSON.parse(this.responseText);
            var html = '';

            for (var i = 0; i < comments.length; i++) {
                html += '<div class="box"><article class="media"><div class="media-content"><div class="content">' +
                    '<p>' + comments[i].content + '</p>' + '<sub>' + new Date(comments[i].createdDate).toLocaleDateString() + ' ' + new Date(comments[i].createdDate).toLocaleTimeString()  + '</sub>' + '</div></div></article></div>';
            }

            existingComments.innerHTML = html;
        }
    };    
    
    xhr.open("GET", getCommentsUrl() + "?link=" + url, true);
    xhr.send();
}

function sendComment() {
    var commentContent = document.getElementById('comment').value;

    if(commentContent != '' && commentContent.length < 1000) {
        getCurrentUrl(AddCommentAjaxQuery);
    }    
}

function plusComment() {
    console.log(plusComment);
}

function minusComment() {
    console.log(minusComment);
}

function reportComment() {
    console.log(reportComment);
}

function AddCommentAjaxQuery(url) {
    var xhr = new XMLHttpRequest();
    var commentContent = document.getElementById('comment').value;
    var language = getCurrentLanguage();
    var link = url;
    var params = "Link=" + link + '&NewCommentContent=' + commentContent + '&CommentLanguage=' + language;

    xhr.onreadystatechange = function() {
        if (xhr.readyState != 4) {
            return;
        }

        document.getElementById('comment').value = '';
        GetExistingComments();
    };    

    xhr.open("POST", getAddCommentUrl(), true);

    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    xhr.send(params);
}