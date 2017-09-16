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

    SetExistingComments();
}

function SetExistingComments() {

    getCurrentUrl(Haah);
}

function Haah(url)
{
    var xhr = new XMLHttpRequest();
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState != 4)
        return;

        if (this.responseText) {
        
            var existingComments = document.getElementById("existing-comments");
            existingComments.innerText = this.responseText;
        }
    };    
    
    xhr.open("GET", getCountUrl() + "?link=" + url, true);
    xhr.send();
}