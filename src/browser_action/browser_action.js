"use strict";

linkRev.sortingStrategies = Object.freeze({ BEST: 0, NEW: 1, OLD: 2 });

linkRev.prototype.init = function() {

    // Basic variables:
    this.nextCommentTimeBlocker = 30000;
    this.maxLength = 1000;
    this.minLength = 2;
    this.saveSortingStrategy = true;

    // State classes:
    this.disabledButtonClass = 'button--disabled';
    this.overlayVisibleClass = 'overlay--visible';
    this.isDangerClass = 'is-danger';
    this.isSuccessClass = 'is-success';
    this.replyToComment = {
        content: '',
        replyToPrimaryCommentId: ''
    };

    // Initial functions:
    this.localizeHtmlPage();

    // DOM selectors:
    this.$commentsCounter = $('#commentsCounter');
    this.$commentContent = $('#comment');
    this.$existingComments = $('#existing-comments');
    this.$submitButton = $('#submitButton');
    this.$errorContainer = $('#errorsContainer');
    this.$selectSorter = $('#comments-sort');
    this.$alert = $('#alert');
    this.$alertTitle = $('#alert-title');
    this.$alertQuote = $('#alert-quote');
    this.$alertQuoteContent = $('#alert-quote-content');
    this.$linkAlertGoTo = $('#alert-go-to');
    this.$buttonSettings = $('#settingsToggle');
    this.$overlaySettings = $('#overlaySettings');
    this.$buttonCloseSettingsOverlay = $('#buttonCloseSettingsOverlay');
    this.$countrySelect = $('#country-select');
    this.$languageSelect = $('#language-select');
    this.$showCommentsFromAllLanguages = $('#showCommentsFromAllLanguages');

    // Functions fired after opening LinkRev extension:
    window.onload = function () {
        this.setHots();
        this.setSelectSorterValue();
        this.getExistingComments();
        this.initEventListeners();
    }.bind(this);
};

linkRev.prototype.setHots = function() {
    var _this = this;

    chrome.storage.local.get('linkRev_hots', function(results) {
        if (results.linkRev_hots && results.linkRev_hots.length > 0) {
            if (results.linkRev_hots[0].hotComment) {
                _this.$alertQuoteContent.text(results.linkRev_hots[0].hotComment);
                _this.$alertQuote.show();
            }

            _this.$alertTitle.text(results.linkRev_hots[0].metaTitle);
            _this.$linkAlertGoTo.attr('href', 'http://' + results.linkRev_hots[0].url);
            _this.$alert.show();
        }
    });
};

linkRev.prototype.setSelectSorterValue = function() {
    var _this = this;

    chrome.storage.local.get('linkRev_commentsSortingStrategy', function(results) {
        if (results.linkRev_commentsSortingStrategy) {
            _this.sortingStrategy = results.linkRev_commentsSortingStrategy;
            _this.$selectSorter.val(_this.sortingStrategy);
        } else {
            _this.sortingStrategy = linkRev.sortingStrategies.BEST;
        }
    }); 
};

linkRev.prototype.initEventListeners = function() {
    var _this = this;

    this.$submitButton.on('click', this.sendComment.bind(this));
    this.$selectSorter.on('change', this.manageSorting.bind(this));

    this.$buttonSettings.on('click', function() {
        chrome.storage.local.get('linkRev_settings', function(results) {
            _this.$languageSelect.val(results.linkRev_settings.language);
            _this.$countrySelect.val(results.linkRev_settings.country);

            if (results.linkRev_settings.showAll) {
                _this.$showCommentsFromAllLanguages.attr('checked', 'checked');
            }

            _this.$overlaySettings.toggleClass(_this.overlayVisibleClass);
        });
    });

    this.$buttonCloseSettingsOverlay.on('click', function() {
        _this.$overlaySettings.removeClass(_this.overlayVisibleClass);
        _this.getExistingComments();
    });

    this.$countrySelect.on('change', this.manageCountry.bind(this));
    this.$languageSelect.on('change', this.manageLanguage.bind(this));
    this.$showCommentsFromAllLanguages.on('change', this.manageShowAllLanguagesSwitch.bind(this));
};

linkRev.prototype.initCommentsEventListeners = function() {
    var _this = this;

    // Handle report button
    $('[data-attribute="reportComment"]').each(function() {
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

    // Handle answer button
    $('[data-attribute="answerComment"]').each(function() {
        $(this).on('click', function() {
            if ($('.box-answer').length > 0) {
                $('.box-answer').remove();
                $('.reply-button').removeClass('visuallyhidden');
            }

            $(this).addClass('visuallyhidden');

            var currentCommentContainer = $(this).closest('.box');

            currentCommentContainer.append('<div class="box-answer"><textarea id="textarea-answer" class="textarea answer-textarea" placeholder="' + chrome.i18n.getMessage('AnswerPlaceholder') + '"></textarea>' +
                '<button id="submitAnswerButton" type="button" class="button is-small is-primary answer-button">' + chrome.i18n.getMessage('AnswerButton') + '</button></div>');

            $('.box-answer')[0].scrollIntoView({behavior: "smooth"});

            $('#submitAnswerButton').on('click', function() {
                _this.replyToComment.replyToPrimaryCommentId = $(this).closest('.box-primary').attr('data-comment-id');
                _this.replyToComment.content = $('#textarea-answer').val();
                _this.getCurrentUrl(_this.replyToCommentAjaxQuery.bind(_this));
            });
        }.bind(this));
    });

    // Handle like button
    $('[data-attribute="likeComment"]').each(function() {
        $(this).on('click', function() {
            var button = this;

            $.ajax({
                type: "POST",
                url: _this.getLikeCommentUrl($(this).attr('data-comment-id')),
                success: function(data) {
                    $('span[data-likesminusdislikes="' + $(button).attr('data-comment-id') + '"]').text(data);
                    _this.updateRatingColor(button);
                },
                dataType: "html"
            });
        });
    });

    // Handle dislike buttons
    $('[data-attribute="dislikeComment"]').each(function() {
        $(this).on('click', function() {
            var button = this;

            $.ajax({
                type: "POST",
                url: _this.getDislikeCommentUrl($(this).attr('data-comment-id')),
                success: function(data) {
                    $('span[data-likesminusdislikes="' + $(button).attr('data-comment-id') + '"]').text(data);
                    _this.updateRatingColor(button);
                },
                dataType: "html"
            });
        });
    });
};

linkRev.prototype.addCommentAjaxQuery = function(url) {
    var _this = this;

    chrome.storage.local.get('linkRev_settings', function(results) {
        var data = "Link=" + url + '&NewCommentContent=' + encodeURIComponent(_this.$commentContent.val()) + '&CommentLanguage=' + results.linkRev_settings.language + '&CommentCountry=' + results.linkRev_settings.country;

        $.ajax({
            type: "POST",
            url: _this.getAddCommentUrl(),
            contentType:"application/x-www-form-urlencoded",
            data: data,
            success: function() {
                _this.saveSortingStrategy = false;
                _this.sortingStrategy = linkRev.sortingStrategies.NEW;
                _this.$selectSorter.val(_this.sortingStrategy);
                _this.$commentContent.val('');
                _this.getExistingComments();
            }.bind(_this),
            dataType: "json"
        });
    });
};

linkRev.prototype.replyToCommentAjaxQuery = function(url) {
    var _this = this;

    chrome.storage.local.get('linkRev_settings', function(results) {
        var data = "Link=" + url + '&NewCommentContent=' + encodeURIComponent(_this.replyToComment.content) + '&ReplyToPrimaryCommentId=' + encodeURIComponent(_this.replyToComment.replyToPrimaryCommentId)  + '&CommentLanguage=' + results.linkRev_settings.language + '&CommentCountry=' + results.linkRev_settings.country;

        $.ajax({
            type: "POST",
            url: _this.getAddCommentUrl(),
            contentType:"application/x-www-form-urlencoded",
            data: data,
            success: function() {
                $('.box-answer').fadeOut(300, function() {$(this).remove();});
                _this.getExistingComments();
            }.bind(_this),
            dataType: "json"
        });
    });
};

linkRev.prototype.existingCommentsAjaxQuery = function(url, settings) {
    var commentsUrl = this.getCommentsUrl() + '?link=' + encodeURIComponent(url) + '&sortingStrategy=' + this.sortingStrategy + '&showAll=' + settings.showAll;

    if (settings.language) {
        commentsUrl += '&language=' + settings.language;
    }

    if (settings.country) {
        commentsUrl += '&country=' + settings.country;
    }

    $.ajax({
        type: "GET",
        url: commentsUrl,
        success: function (comments) {
            if (comments) {
                var html = '';
                var _this = this;

                this.$commentsCounter.text(comments.length);

                for (var i = 0; i < comments.length; i++) {
                    if (!comments[i].replyToPrimaryCommentId) {
                        let cleanId = this.cleanDomString(comments[i]._id);
                        let cleanCreatedDateTime = this.cleanDomString(comments[i].createdDate);
                        let cleanContent = this.cleanDomString(comments[i].content);
                        let cleanLikesMinusDislikes = parseInt(comments[i].likesMinusDislikes);

                        html += '<div class="box box-primary" data-comment-id="' + cleanId + '"><div class="content content-primary"><div class="box__head"><sub>ID: <span>' + cleanId.toString().substr(cleanId.length - 5) + '</span>' + ' ' + new Date(cleanCreatedDateTime).toLocaleDateString() +
                        ' ' + new Date(cleanCreatedDateTime).toLocaleTimeString() + '</sub><span class="rating">' +
                        '<button class="icon has-text-success pointer" data-attribute="likeComment" data-like-id="' + cleanId + '" data-comment-id="' + cleanId + '"><i class="fa fa-plus-square"></i></button>' + '<span class="rate__number" data-likesminusdislikes="' + cleanId + '">' + cleanLikesMinusDislikes + '</span>' +
                        '<button class="icon has-text-danger pointer" data-attribute="dislikeComment" data-dislike-id="' + cleanId + '" data-comment-id="' + cleanId + '"><i class="fa fa-minus-square"></i></button></span>' +
                        '</div><p class="comment__content">' + cleanContent + '</p><div class="box__footer">' +
                        '<button class="button is-primary reply-button is-small" data-attribute="answerComment" data-comment-id="' + cleanId + '">' + chrome.i18n.getMessage('Answer') + '</button>' +
                        '<button class="button is-small no-border grey" data-attribute="reportComment" data-comment-id="' + cleanId + '">' + chrome.i18n.getMessage('Report') + '</button>' +
                        '</div></div></div>';
                    } else {
                        let cleanId = this.cleanDomString(comments[i]._id);
                        let cleanCreatedDateTime = this.cleanDomString(comments[i].createdDate);
                        let cleanContent = this.cleanDomString(comments[i].content);
                        let cleanLikesMinusDislikes = parseInt(comments[i].likesMinusDislikes);
                        let replyToPrimaryCommentId = this.cleanDomString(comments[i].replyToPrimaryCommentId);

                        setTimeout(function() {
                            $('.box-primary[data-comment-id="' + replyToPrimaryCommentId + '"]').find('.content-primary').after(
                                '<div class="box" data-comment-id="' + cleanId + '"><div class="content"><div class="box__head"><sub>ID: <span>' + cleanId.toString().substr(cleanId.length - 5) + '</span>' + ' ' + new Date(cleanCreatedDateTime).toLocaleDateString() +
                                ' ' + new Date(cleanCreatedDateTime).toLocaleTimeString() + '</sub><span class="rating">' +
                                '<button class="icon has-text-success pointer" data-attribute="likeComment" data-like-id="' + cleanId + '" data-comment-id="' + cleanId + '"><i class="fa fa-plus-square"></i></button>' + '<span class="rate__number" data-likesminusdislikes="' + cleanId + '">' + cleanLikesMinusDislikes + '</span>' +
                                '<button class="icon has-text-danger pointer" data-attribute="dislikeComment" data-dislike-id="' + cleanId + '" data-comment-id="' + cleanId + '"><i class="fa fa-minus-square"></i></button></span>' +
                                '</div><p class="comment__content">' + cleanContent + '</p><div class="box__footer">' +
                                '<button class="button is-small no-border grey" data-attribute="reportComment" data-comment-id="' + cleanId + '">' + chrome.i18n.getMessage('Report') + '</button>' +
                                '</div></div></div>');
                        }, 0);
                    }
                }

                if (comments.length > 0 && comments.length < 2) {
                    $('#comments-order-panel').hide();
                    $('#be-first-panel').hide();
                } else if (comments.length > 0) {
                    $('#comments-order-panel').show();
                    $('#be-first-panel').hide();
                } else {
                    $('#comments-order-panel').hide();
                    $('#be-first-panel').show();
                }

                this.$existingComments.html(html);

                setTimeout(function() {
                    _this.initCommentsEventListeners();
                    _this.checkRatings();
                }, 0);
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
        this.getCurrentUrl(this.addCommentAjaxQuery.bind(this));
        this.createValidationMessage('CommentSuccess', this.isSuccessClass);

        this.$submitButton.addClass(this.disabledButtonClass);
        setTimeout(this.activateButton.bind(this), this.nextCommentTimeBlocker);
    }
};

linkRev.prototype.manageCountry = function() {
    var _this = this;

    chrome.storage.local.get('linkRev_settings', function(results) { 
        results.linkRev_settings.country = _this.$countrySelect.val();
        chrome.storage.local.set({'linkRev_settings': results.linkRev_settings});
    });
};

linkRev.prototype.manageLanguage = function() {
    var _this = this;
    
    chrome.storage.local.get('linkRev_settings', function(results) { 
        results.linkRev_settings.language = _this.$languageSelect.val();
        chrome.storage.local.set({'linkRev_settings': results.linkRev_settings});
    });
};

linkRev.prototype.manageShowAllLanguagesSwitch = function() {
    var _this = this;
    
    chrome.storage.local.get('linkRev_settings', function(results) { 
        results.linkRev_settings.showAll = _this.$showCommentsFromAllLanguages.is(':checked');
        chrome.storage.local.set({'linkRev_settings': results.linkRev_settings});
    });
};

linkRev.prototype.manageSorting = function() {
    var _this = this;

    this.sortingStrategy = this.$selectSorter.val();

    if (this.saveSortingStrategy) {
        chrome.storage.local.set({'linkRev_commentsSortingStrategy': this.$selectSorter.val()}, function() {
            _this.getExistingComments();
        });
    } else {
        this.getExistingComments();
    }    

    this.saveSortingStrategy = true;
};

linkRev.prototype.cleanDomString = function(data) {
    return data.replace(/<[^>]*>?/g, '');
};

linkRev.prototype.activateButton = function() {
    this.$submitButton.removeClass(this.disabledButtonClass);
};

linkRev.prototype.checkRatings = function() {
    var ratedComments = $('[data-likesminusdislikes]');

    ratedComments.each(function(){
        if ($(this).text() > 0) {
            $(this).addClass('has-text-success');
        } else if ($(this).text() < 0) {
            $(this).addClass('has-text-danger');
        }
    });
};

linkRev.prototype.updateRatingColor = function(element) {
    var currentNumber = $(element).parent().find('.rate__number');
    var currentNumberValue = parseInt(currentNumber.text());

    currentNumber.removeClass('has-text-success', 'has-text-danger');

    if (currentNumberValue > 0) {
        currentNumber.addClass('has-text-success');
    } else if (currentNumberValue < 0) {
        currentNumber.addClass('has-text-danger');
    }
};

linkRev.prototype.createValidationMessage = function(message, additionalClass) {
    var messageData = '<div class=\"notification ' + additionalClass + ' validation\">' + chrome.i18n.getMessage(message) + '</div>';

    this.$errorContainer.html(messageData);
};

linkRev.prototype.getExistingComments = function() {
    var _this = this;
    
    chrome.storage.local.get('linkRev_settings', function(results) {
        if (results.linkRev_settings) {
            _this.$buttonSettings.show();
            _this.getCurrentUrl(_this.existingCommentsAjaxQuery.bind(_this), results.linkRev_settings);
        } else {
            var language = _this.getCurrentLanguage();
            var country = _this.getCurrentCountry(language);
            var showAll = false;
            var settings = {
                language: language,
                country: country,
                showAll: showAll
            };

            chrome.storage.local.set({'linkRev_settings': settings}, function() {
                _this.$buttonSettings.show();
                _this.getCurrentUrl(_this.existingCommentsAjaxQuery.bind(_this), settings);
            });
        }
    });    
};

linkRev.prototype.getAddCommentUrl = function() {
    return this.getBasicUrl() +  "api/comment";
};

linkRev.prototype.getAddReportingUrl = function() {
    return this.getBasicUrl() +  "api/reporting/";
};

linkRev.prototype.getLikeCommentUrl = function(commentId) {
    return this.getBasicUrl() +  "api/comment/" + commentId + "/like";
};

linkRev.prototype.getDislikeCommentUrl = function(commentId) {
    return this.getBasicUrl() +  "api/comment/" + commentId + "/dislike";
};

document.addEventListener('DOMContentLoaded', function() {
    new linkRev();
});