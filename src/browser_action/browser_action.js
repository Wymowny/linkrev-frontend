function localizeHtmlPage()
{
    var objects = document.getElementsByTagName('html');
    for (var j = 0; j < objects.length; j++)
    {
        var obj = objects[j];

        var valStrH = obj.innerHTML.toString();
        var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function(match, v1)
        {
            return v1 ? chrome.i18n.getMessage(v1) : "";
        });

        if(valNewH != valStrH)
        {
            obj.innerHTML = valNewH;
        }
    }
}

localizeHtmlPage();

window.onload = function() {

    GetExistingComments();
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("submit-button").addEventListener("click", sendComment);
  });

function GetExistingComments() {

    getCurrentUrl(ExistingCommentsAjaxQuery);
}

function ExistingCommentsAjaxQuery(url)
{
    var xhr = new XMLHttpRequest();
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState != 4)
        return;

        if (this.responseText) {
        
            var existingComments = document.getElementById("comments");
            
            var comments = JSON.parse(this.responseText);

            var html = '';
            for (var i = 0; i < comments.length; i++) {

                html += '<div class="box"><article class="media"><div class="media-content"><div class="content"><p>' + comments[i].content + '</p>' + '<sub>' + new Date(comments[i].createdDate).toLocaleDateString() + ' ' + new Date(comments[i].createdDate).toLocaleTimeString()  + '</sub>' + '</div></div></article></div>';
            }

            existingComments.innerHTML = html;
        }
    };    
    
    xhr.open("GET", getCommentsUrl() + "?link=" + url, true);
    xhr.send();
}

function sendComment() {

    getCurrentUrl(AddCommentAjaxQuery);
}

function AddCommentAjaxQuery(url) {

    var xhr = new XMLHttpRequest();
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState != 4)
        return;

        document.getElementById('comment').value = '';
        GetExistingComments();
    };    
    
    var commentContent = document.getElementById('comment').value;
    var link = url;
    var language = getCurrentLanguage();

    var params = "Link=" + link + '&NewCommentContent=' + commentContent + '&Language=' + language;

    xhr.open("POST", getAddCommentUrl(), true);

    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    xhr.send(params);
}