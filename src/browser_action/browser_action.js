"use strict";

function linkRev() {
    this.init();
}

linkRev.prototype.init = function() {
    this.validAttrs = ['class', 'id', 'href', 'style'];
    this.basicUrl = "https://linkrev.com/";
    this.nextCommentTimeBlocker = 30000;

    this.onUpdatedTab();
    this.onActivatedTab();
    this.localizeHtmlPage();
    this.initEventListeners();

    window.onload = function () {
        this.getExistingComments();
    }.bind(this);
};

linkRev.prototype.initEventListeners = function() {
    document.getElementById("submitButton").addEventListener("click", this.sendComment.bind(this));
};

linkRev.prototype.initCommentsEventListeners = function() {

    var _this = this;
    
    $("[data-attribute='reportComment']").each(function() {

        $(this).on('click', function() {

            var button = this;

            $.ajax({
                type: "POST",
                url: _this.getAddReportingUrl() + $(this).attr('data-comment-id'),
                success: function(data) {

                    $(button).html('<i class="fa fa-check"></i>&nbsp;' + chrome.i18n.getMessage('SentSuccessfully'));
                    $(button).attr('disabled', true);
                },
                dataType: "html"
            });
        });
      });
};

linkRev.prototype.localizeHtmlPage = function() {
    var objects = document.getElementsByTagName('html');

    for (var j = 0; j < objects.length; j++) {
        var obj = objects[j];
        var valStrH = obj.innerHTML.toString();
        var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function(match, v1) {
            return v1 ? chrome.i18n.getMessage(v1) : "";
        });

        if (valNewH != valStrH) {
            obj.innerHTML = valNewH;
        }
    }
};

linkRev.prototype.removeInvalidAttributes = function(target) {
    var attrs = target.attributes, currentAttr;

    for (var i = attrs.length - 1; i >= 0; i--) {
        currentAttr = attrs[i].name;

        if (attrs[i].specified && this.validAttrs.indexOf(currentAttr) === -1) {
            target.removeAttribute(currentAttr);
        }

        if (currentAttr === "href" && /javascript[:]/gi.test(target.getAttribute("href"))) {
            target.parentNode.removeChild(target);
        }
    }
};

linkRev.prototype.cleanDomString = function(data) {
    
    return data.replace(/<[^>]*>?/g, '');
};

linkRev.prototype.addCommentAjaxQuery = function(url) {
    var commentContent = document.getElementById('comment').value;
    var language = this.getCurrentLanguage();
    var link = url;
    var data = "Link=" + link + '&NewCommentContent=' + encodeURIComponent(commentContent) + '&CommentLanguage=' + language;

    $.ajax({
        type: "POST",
        url: this.getAddCommentUrl(),
        contentType:"application/x-www-form-urlencoded",
        data: data,
        success: function() {
            document.getElementById('comment').value = '';
            this.getExistingComments();
        }.bind(this),
        dataType: "json"
    });
};

linkRev.prototype.existingCommentsAjaxQuery = function(url) {
    var commentsUrl = this.getCommentsUrl() + '?link=' + url;

    $.ajax({
        type: "GET",
        url: commentsUrl,
        success: function (comments) {
            if (comments) {
                var html = '';

                $('#commentsCounter').text(comments.length);

                for (var i = 0; i < comments.length; i++) {
                    html += '<div class="box"><div class="content"><div class="box__head"><sub>' + new Date(this.cleanDomString(comments[i].createdDate)).toLocaleDateString() +
                        ' ' + new Date(this.cleanDomString(comments[i].createdDate)).toLocaleTimeString() + '</sub><span class="rating"><span class="has-text-success">25</span>' +
                        '<button class="icon has-text-success" data-attribute="plusForComment"><i class="fa fa-plus-square"></i></button>' +
                        '<button class="icon has-text-danger" data-attribute="minusForComment"><i class="fa fa-minus-square"></i></button></span>' +
                        '</div><p class="comment__content">' + this.cleanDomString(comments[i].content) + '</p><div class="box__footer">' +
                        '<button class="button is-primary is-small" data-attribute="reportComment" data-comment-id="' + this.cleanDomString(comments[i]._id) + '"><i class="fa fa-warning"></i> Report</button>' +
                        '</div></div></div>';
                }

                $('#existing-comments').html(html);

                this.initCommentsEventListeners();
            }
        }.bind(this),
        dataType: "json"
    });
};

linkRev.prototype.sendComment = function() {
    if ($('#comment').val().length < 2) {
        this.createValidationMessage('MessageLengthUnder', 'is-danger');
    } else if ($('#comment').val().length > 1000) {
        this.createValidationMessage('MessageLengthOver', 'is-danger');
    } else if ($('#submitButton').hasClass('button--disabled')) {
        this.createValidationMessage('MessageTiming', 'is-danger');
    } else {
        this.getCurrentUrl(this.addCommentAjaxQuery);
        this.createValidationMessage('CommentSuccess', 'is-success');

        $('#submitButton').addClass('button--disabled');
        setTimeout(this.activateButton, this.nextCommentTimeBlocker);
    }
};

linkRev.prototype.activateButton = function() {
    $('#submitButton').removeClass('button--disabled');
};

linkRev.prototype.createValidationMessage = function(message, additionalClass) {
    var messageContainer = document.getElementById("errorsContainer");
    var messageData = '<div class=\"notification ' + additionalClass + ' validation\">' + chrome.i18n.getMessage(message) + '</div>';

    messageContainer.innerHTML = messageData;
};

linkRev.prototype.getExistingComments = function() {
    this.getCurrentUrl(this.existingCommentsAjaxQuery.bind(this));
};

linkRev.prototype.getCountUrl = function() {
    return this.basicUrl +  "api/comments/count";
};

linkRev.prototype.getCommentsUrl = function() {
    return this.basicUrl +  "api/comments";
};

linkRev.prototype.getAddCommentUrl = function() {
    return this.basicUrl +  "api/comment";
};

linkRev.prototype.getAddReportingUrl = function() {
    return this.basicUrl +  "api/reporting/";
};

linkRev.prototype.getCurrentUrl = function(callback) {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        callback(tabs[0].url);
    }.bind(this));
};

linkRev.prototype.getCurrentLanguage = function() {
    var language = window.navigator.userLanguage || window.navigator.language;

    if (language.length > 2) {
        language = language.substring(0, 2);
    }

    return language;
};

linkRev.prototype.onUpdatedTab = function() {
    chrome.tabs.onUpdated.addListener(function (tabid, changeinfo, tab) {
        var url = tab.url;

        if (url !== undefined && changeinfo.status == "complete") {
            this.updateCommentsCount();
        }
    }.bind(this));
};

linkRev.prototype.onActivatedTab = function() {
    chrome.tabs.onActivated.addListener(function(details) {
        this.updateCommentsCount();
    }.bind(this));
};

linkRev.prototype.updateCommentsCount = function() {
    var _this = this;

    this.getCurrentUrl(_this.unreadMessagesCount());
};

linkRev.prototype.unreadMessagesCount = function(url) {
    var _this = this;

    this.getInboxCount(
        url, function(count) {
            _this.updateUnreadCount(count);
        },

        function() {
            chrome.storage.local.remove('unreadCount', function() {
                _this.updateIcon();
            });
        }
    );
};

linkRev.prototype.updateUnreadCount = function(count) {
    chrome.storage.local.get('unreadCount', function(results) {
        var changed = results.unreadCount != count;

        if (changed) {
            chrome.storage.local.set({'unreadCount': count}, function() {
                this.updateIcon();
            });
        }
    });
};

linkRev.prototype.updateIcon = function() {
    chrome.storage.local.get('unreadCount', function(results) {
        if (results.unreadCount) {
            chrome.browserAction.setBadgeBackgroundColor({color:[208, 0, 24, 255]});
            chrome.browserAction.setBadgeText({
                text: results.unreadCount != "0" ? results.unreadCount : ""
            });
        } else {
            chrome.browserAction.setBadgeBackgroundColor({color:[190, 190, 190, 230]});
            chrome.browserAction.setBadgeText({text:"0"});
        }
    });
};

linkRev.prototype.getInboxCount = function(url, onSuccess, onError) {
    var commentsUrl = this.getCommentsUrl() + '?link=' + url;

    $.ajax({
        type: "GET",
        url: commentsUrl + "?link=" + url,
        success: function(count) {
            onSuccess(count);
        }.bind(this),
        error: onError,
        dataType: "html"
    });
};

document.addEventListener('DOMContentLoaded', function() {
    new linkRev();
});
