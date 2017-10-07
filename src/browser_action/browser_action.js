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

    $.ajax({
        type: "GET",
        url: getCommentsUrl() + "?link=" + url,
        success: function(comments) {

            if (comments) {
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

                $('#existing-comments').html(safeResponse.cleanDomString(html));
            }
        },
        dataType: "json"
    });
}

function sendComment() {
    if ($('#comment').val().length < 2) {
        createValidationMessage('__MSG_MessageLengthUnder__', 'is-danger');
    } else if ($('#comment').val().length > 1000) {
        createValidationMessage('__MSG_MessageLengthOver__', 'is-danger');
    } else if ($('#submitButton').hasClass('button--disabled')) {
        createValidationMessage('__MSG_MessageTiming__', 'is-danger');
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
    var messageData = '<div class=\"notification ' + additionalClass + ' validation\">' + message +'</div>';

    messageContainer.innerHTML = messageData;
}

function AddCommentAjaxQuery(url) {

    var commentContent = document.getElementById('comment').value;
    var language = getCurrentLanguage();
    var link = url;
    var data = "Link=" + link + '&NewCommentContent=' + encodeURIComponent(commentContent) + '&CommentLanguage=' + language;

    $.ajax({
        type: "POST",
        url: getAddCommentUrl(),
        contentType:"application/x-www-form-urlencoded",
        data: data,
        success: function() {

            document.getElementById('comment').value = '';
            GetExistingComments();
        },
        dataType: "json"
    });
}