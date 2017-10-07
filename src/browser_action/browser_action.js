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
            var existingComments = document.getElementById("comments");
            var comments = JSON.parse(this.responseText);
            var html = '';

            $('#commentsCounter').text(comments.length);

            for (var i = 0; i < comments.length; i++) {
                html += '<div class="box"><div class="content"><div class="box__head"><sub>' + new Date(comments[i].createdDate).toLocaleDateString() +
                    ' ' + new Date(comments[i].createdDate).toLocaleTimeString() + '</sub><span class="rating"><span class="has-text-success">25</span>' +
                    '<button class="icon has-text-success" data-attribute="plusForComment"><i class="fa fa-plus-square"></i></button>' +
                    '<button class="icon has-text-danger" data-attribute="minusForComment"><i class="fa fa-minus-square"></i></button></span>' +
                    '</div><p class="comment__content">' + comments[i].content + '</p><div class="box__footer">' +
                    '<button class="button is-primary is-small" data-attribute="reportComment"><i class="fa fa-warning"></i> Report</button>' +
                    '</div></div></div>';
            }

            existingComments.innerHTML = html;
        }
    };    
    
    xhr.open("GET", getCommentsUrl() + "?link=" + url, true);
    xhr.send();
}

function sendComment() {
    if ($('#comment').val().length < 2) {
        createValidationMessage('__MSG_MessageLengthUnder__');
    } else if ($('#comment').val().length > 1000) {
        createValidationMessage('__MSG_MessageLengthOver__');
    } else if ($('#submitButton').hasClass('button--disabled')) {
        createValidationMessage('__MSG_MessageTiming__');
    } else {
        getCurrentUrl(AddCommentAjaxQuery);
        createValidationMessage('__MSG_CommentSuccess__', 'is-success');

        $('#submitButton').addClass('button--disabled');
        window.setTimeout(activateButton, 30000);
    }
}

function activateButton() {
    $('#submitButton').removeClass('button--disabled');
}

function createValidationMessage(message, additionalClass) {
    var messageContainer = document.getElementById("errorsContainer");
    var messageData = '<div class=\"notification is-danger validation\">' + message +'</div>';

    messageContainer.innerHTML = messageData;
}

function fadeOutElement(id) {
    var elem = document.getElementById(id);

    $(elem).fadeOut("normal", function() {
        $(this).remove();
    });
}

function AddCommentAjaxQuery(url) {
    var xhr = new XMLHttpRequest();
    var commentContent = document.getElementById('comment').value;
    var language = getCurrentLanguage();
    var link = url;
    var params = "Link=" + link + '&NewCommentContent=' + encodeURIComponent(commentContent) + '&CommentLanguage=' + language;

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