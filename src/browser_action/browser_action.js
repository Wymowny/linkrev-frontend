"use strict";

function linkRev() {
    this.init();
}

linkRev.prototype.init = function() {

    // Basic variables:
    this.validAttrs = ['class', 'id', 'href', 'style'];
    this.basicUrl = "https://linkrev.com/";
    this.nextCommentTimeBlocker = 30000;
    this.minLength = 2;
    this.maxLength = 1000;

    // State classes:
    this.disabledButtonClass = 'button--disabled';
    this.isDangerClass = 'is-danger';
    this.isSuccessClass = 'is-success';
    this.hasTextSuccessClass = 'has-text-success';
    this.hasTextDangerClass = 'has-text-danger';

    // Initial functions:
    this.onUpdatedTab();
    this.onActivatedTab();
    this.localizeHtmlPage();

    // DOM selectors:
    this.$commentsCounter = $('#commentsCounter');
    this.$commentContent = $('#comment');
    this.$existingComments = $('#existing-comments');
    this.$submitButton = $('#submitButton');
    this.$errorContainer = $('#errorsContainer');

    // Functions fired after opening LinkRev extension:
    window.onload = function () {
        this.getExistingComments();
        this.initEventListeners();
        this.checkRatings();
    }.bind(this);
};

linkRev.prototype.initEventListeners = function() {
    this.$submitButton.on('click', this.sendComment.bind(this));
};

linkRev.prototype.initCommentsEventListeners = function() {
    var _this = this;

    // Handle report button
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

    // Handle like button
    $("[data-attribute='likeComment']").each(function() {
        $(this).on('click', function() {
            var button = this;

            $.ajax({
                type: "POST",
                url: _this.getLikeCommentUrl($(this).attr('data-comment-id')),
                success: function(data) {
                    $('span[data-likesminusdislikes="' + $(button).attr('data-comment-id') + '"]').text(data);
                },
                dataType: "html"
            });
        });
    });

    // Handle dislike button
    $("[data-attribute='dislikeComment']").each(function() {
        $(this).on('click', function() {
            var button = this;

            $.ajax({
                type: "POST",
                url: _this.getDislikeCommentUrl($(this).attr('data-comment-id')),
                success: function(data) {
                    $('span[data-likesminusdislikes="' + $(button).attr('data-comment-id') + '"]').text(data);
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
    var language = this.getCurrentLanguage();
    var link = url;
    var data = "Link=" + link + '&NewCommentContent=' + encodeURIComponent(this.$commentContent.val()) + '&CommentLanguage=' + language;

    $.ajax({
        type: "POST",
        url: this.getAddCommentUrl(),
        contentType:"application/x-www-form-urlencoded",
        data: data,
        success: function() {
            this.$commentContent.val('');
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

                this.$commentsCounter.text(comments.length);

                for (var i = 0; i < comments.length; i++) {
                    var cleanId = this.cleanDomString(comments[i]._id);
                    var cleanCreatedDateTime = this.cleanDomString(comments[i].createdDate);
                    var cleanContent = this.cleanDomString(comments[i].content);
                    var cleanLikesMinusDislikes = parseInt(comments[i].likesMinusDislikes);

                    html += '<div class="box"><div class="content"><div class="box__head"><sub>' + new Date(cleanCreatedDateTime).toLocaleDateString() +
                        ' ' + new Date(cleanCreatedDateTime).toLocaleTimeString() + '</sub><span class="rating">' +
                        '<button class="icon has-text-success pointer" data-attribute="likeComment" data-like-id="' + cleanId + '" data-comment-id="' + cleanId + '"><i class="fa fa-plus-square"></i></button>' + '<span class="rate__number" data-likesminusdislikes="' + cleanId + '">' + cleanLikesMinusDislikes + '</span>' +
                        '<button class="icon has-text-danger pointer" data-attribute="dislikeComment" data-dislike-id="' + cleanId + '" data-comment-id="' + cleanId + '"><i class="fa fa-minus-square"></i></button></span>' +
                        '</div><p class="comment__content">' + cleanContent + '</p><div class="box__footer">' +
                        '<button class="button is-info is-small" data-attribute="reportComment" data-comment-id="' + cleanId + '"><i class="fa fa-warning"></i>' + chrome.i18n.getMessage('Report')  + '</button>' +
                        '</div></div></div>';
                }

                if (comments.length > 0) {

                    $('#comments-order-panel').show();
                    $('#be-first-panel').hide();
                }
                else {

                    $('#comments-order-panel').hide();
                    $('#be-first-panel').show();
                }
                
                this.$existingComments.html(html);
                this.initCommentsEventListeners();
            }
        }.bind(this),
        dataType: "json"
    });
};

linkRev.prototype.sendComment = function() {
    if (this.$commentContent.val().length < this.minLength) {
        this.createValidationMessage('MessageLengthUnder', this.isDangerClass);
    } else if (this.$commentContent.val().length > this.maxLength) {
        this.createValidationMessage('MessageLengthOver', this.isDangerClass);
    } else if (this.$submitButton.hasClass('button--disabled')) {
        this.createValidationMessage('MessageTiming', this.isDangerClass);
    } else {
        this.getCurrentUrl(this.addCommentAjaxQuery);
        this.createValidationMessage('CommentSuccess', this.isSuccessClass);

        this.$submitButton.addClass(this.disabledButtonClass);
        setTimeout(this.activateButton, this.nextCommentTimeBlocker);
    }
};

linkRev.prototype.activateButton = function() {
    this.$submitButton.removeClass(this.disabledButtonClass);
};

linkRev.prototype.checkRatings = function() {
    var ratedComments = $('[data-attribute="ratingValue"]');

    for (var i = 0; i <= ratedComments.length; i++) {
        if (ratedComments.val() > 0) {
            this.addClass(this.hasTextSuccessClass);
        } else if (ratedComments.val() < 0) {
            this.addClass(this.hasTextDangerClass);
        }
    }
};

linkRev.prototype.createValidationMessage = function(message, additionalClass) {
    var messageData = '<div class=\"notification ' + additionalClass + ' validation\">' + chrome.i18n.getMessage(message) + '</div>';

    this.$errorContainer.html(messageData);
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

linkRev.prototype.getLikeCommentUrl = function(commentId) {
    return this.basicUrl +  "api/comment/" + commentId + "/like";
};

linkRev.prototype.getDislikeCommentUrl = function(commentId) {
    return this.basicUrl +  "api/comment/" + commentId + "/dislike";
};

linkRev.prototype.getCurrentUrl = function(callback) {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        callback(tabs[0].url);
    });
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
