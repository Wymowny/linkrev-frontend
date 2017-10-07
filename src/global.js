function getBaseUrl() {
    return "https://linkrev.com/";
}
  
function getCountUrl() {
    return this.getBaseUrl() +  "api/comments/count";
}

function getCommentsUrl() {
    return this.getBaseUrl() +  "api/comments";
}

function getAddCommentUrl() {
    return this.getBaseUrl() +  "api/comment";
}

function getCurrentUrl(callback) {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        callback(tabs[0].url);
    });
}

function getCurrentLanguage() {
    var language = window.navigator.userLanguage || window.navigator.language;

    if (language.length > 2) {
        language = language.substring(0, 2);
    }
 
    return language;
}

// This function comes from https://github.com/operatester/safeResponse/blob/1.1/safeResponse.js
safeResponse = function() {
    
        var validAttrs = [ "class", "id", "href", "style" ];
        
        this.__removeInvalidAttributes = function(target) {
            var attrs = target.attributes, currentAttr;
    
            for (var i = attrs.length - 1; i >= 0; i--) {
                currentAttr = attrs[i].name;
    
                if (attrs[i].specified && validAttrs.indexOf(currentAttr) === -1) {
                    target.removeAttribute(currentAttr);
                }
    
                if (
                    currentAttr === "href" &&
                    /javascript[:]/gi.test(target.getAttribute("href"))
                ) {
                    target.parentNode.removeChild(target);
                }
            }
        }
        
        this.__cleanDomString = function(data) {
            var parser = new DOMParser;
            var tmpDom = parser.parseFromString(data, "text/html").body;
    
            var list, current, currentHref;
    
            list = tmpDom.querySelectorAll("script,img");
    
            for (var i = list.length - 1; i >= 0; i--) {
                current = list[i];
                current.parentNode.removeChild(current);
            }
    
            list = tmpDom.getElementsByTagName("*");
    
            for (i = list.length - 1; i >= 0; i--) {
                parent.__removeInvalidAttributes(list[i]);
            }
    
            return tmpDom.innerHTML;
        }
        
        return{
            cleanDomString: function(html){
                return parent.__cleanDomString(html)
            }
        }
    }();