"use strict";

linkRev.sortingStrategies = Object.freeze({ BEST: 0, NEW: 1, OLD: 2 });

linkRev.prototype.init = function() {

    // Basic variables:
    this.nextCommentTimeBlocker = 30000;
    this.maxLength = 1000;
    this.maxHrefLength = 30;
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
    this.$hotComment = $('#link-hot-comment');
    this.$arrowUpButton = $('#arrow-up-button');
    this.$rating = $('#rating');
    this.$linkRating = $('#link-rating');
    this.$arrowDownButton = $('#arrow-down-button');
    this.$showCommentsFromAllLanguages = $('#showCommentsFromAllLanguages');

    // Functions fired after opening LinkRev extension:
    window.onload = function () {
        this.setRating();
        this.setHotComment();
        this.setHots();
        this.setSelectSorterValue();
        this.getExistingComments();
        this.initEventListeners();
    }.bind(this);
};

linkRev.prototype.setRating = function() {
    var _this = this;

    chrome.storage.local.get('linkRev_likesDislikes', function(results) {
        if (results.linkRev_likesDislikes) {
            var rating = parseInt(results.linkRev_likesDislikes.likes) - parseInt(results.linkRev_likesDislikes.dislikes);

            _this.setLinkRating(rating);
        }
    });
};

linkRev.prototype.setLinkRating = function(rating) {
    if (rating > 0) {
        this.$linkRating.attr('class', 'header__number header__green-rating');
        this.$linkRating.text('+' + rating);
    } else if (rating < 0) {
        this.$linkRating.attr('class', 'header__number header__red-rating');
        this.$linkRating.text(rating);
    } else {
        this.$linkRating.attr('class', 'header__number');
        this.$linkRating.text(rating);
    }            

    this.$rating.show();
};

linkRev.prototype.setHotComment = function() {
    var _this = this;

    chrome.storage.local.get('linkRev_hotComment', function(results) {
        if (results.linkRev_hotComment && results.linkRev_hotComment.length) {
            _this.$hotComment.append('<blockquote class="comment__content">' + results.linkRev_hotComment.toString() + '<span class="comment-cover">' + chrome.i18n.getMessage('ShowMore') + '</span></blockquote>');
            _this.$hotComment.show();
        }
    });
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

    this.$arrowUpButton.on('click', function() {

        _this.getCurrentUrl(_this.voteLinkUp.bind(_this));
        _this.$arrowUpButton.attr('disabled', 'disabled');
        _this.$arrowDownButton.attr('disabled', 'disabled');
    });

    this.$arrowDownButton.on('click', function() {
        _this.getCurrentUrl(_this.voteLinkDown.bind(_this));
        _this.$arrowUpButton.attr('disabled', 'disabled');
        _this.$arrowDownButton.attr('disabled', 'disabled');
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

            currentCommentContainer.find('.content-primary').after('<div class="box-answer"><textarea id="textarea-answer" class="textarea answer-textarea" placeholder="' + chrome.i18n.getMessage('AnswerPlaceholder') + '"></textarea>' +
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

    // Handle links
    setTimeout(function() {
        $('a.external-link').each(function() {
            $(this).on('click', function() {
                chrome.tabs.create({url: $(this).attr('href')});
                return false;
            });
        });
    }, 0);
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

linkRev.prototype.voteLinkUp = function(url) {
    var _this = this;

    chrome.storage.local.get('linkRev_settings', function(results) {
        var data = "Url=" + encodeURIComponent(url) + '&Language=' + results.linkRev_settings.language;

        $.ajax({
            type: "POST",
            url: _this.getVoteLinkUpUrl(),
            contentType:"application/x-www-form-urlencoded",
            data: data,
            success: function(data) {
                var rating = parseInt(data.likes) - parseInt(data.dislikes);
                _this.setLinkRating(rating);
            }.bind(_this),
            dataType: "json"
        });
    });
};

linkRev.prototype.voteLinkDown = function(url) {
    var _this = this;

    chrome.storage.local.get('linkRev_settings', function(results) {
        var data = "Url=" + encodeURIComponent(url) + '&Language=' + results.linkRev_settings.language;

        $.ajax({
            type: "POST",
            url: _this.getVoteLinkDownUrl(),
            contentType:"application/x-www-form-urlencoded",
            data: data,
            success: function(data) {
                var rating = parseInt(data.likes) - parseInt(data.dislikes);
                _this.setLinkRating(rating);
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
                        let cleanId = this.cleanDomString(comments[i]._id),
                            cleanCreatedDateTime = this.cleanDomString(comments[i].createdDate),
                            cleanContent = this.cleanDomString(comments[i].content),
                            cleanLikesMinusDislikes = parseInt(comments[i].likesMinusDislikes);

                        html += '<div class="box box-primary" data-comment-id="' + cleanId + '"><div class="content content-primary"><div class="box__head"><sub>ID: <span>' + cleanId.toString().substr(cleanId.length - 5) + '</span>' + ' ' + new Date(cleanCreatedDateTime).toLocaleDateString() +
                        ' ' + new Date(cleanCreatedDateTime).toLocaleTimeString() + '</sub><span class="rating">' +
                        '<button class="icon has-text-success pointer" data-attribute="likeComment" data-like-id="' + cleanId + '" data-comment-id="' + cleanId + '"><i class="fa fa-plus-square"></i></button>' + '<span class="rate__number" data-likesminusdislikes="' + cleanId + '">' + cleanLikesMinusDislikes + '</span>' +
                        '<button class="icon has-text-danger pointer" data-attribute="dislikeComment" data-dislike-id="' + cleanId + '" data-comment-id="' + cleanId + '"><i class="fa fa-minus-square"></i></button></span>' +
                        '</div><p class="comment__content">' + _this.urlify(cleanContent) + '<span class="comment-cover">' + chrome.i18n.getMessage('ShowMore') + '</span></p><div class="box__footer">' +
                        '<button class="button is-primary reply-button is-small" data-attribute="answerComment" data-comment-id="' + cleanId + '">' + chrome.i18n.getMessage('Answer') + '</button>' +
                        '<button class="button is-small no-border grey" data-attribute="reportComment" data-comment-id="' + cleanId + '">' + chrome.i18n.getMessage('Report') + '</button>' +
                        '</div></div></div>';
                    } else {
                        let cleanId = this.cleanDomString(comments[i]._id),
                            cleanCreatedDateTime = this.cleanDomString(comments[i].createdDate),
                            cleanContent = this.cleanDomString(comments[i].content),
                            cleanLikesMinusDislikes = parseInt(comments[i].likesMinusDislikes),
                            replyToPrimaryCommentId = this.cleanDomString(comments[i].replyToPrimaryCommentId);

                        setTimeout(function() {
                            $('.box-primary[data-comment-id="' + replyToPrimaryCommentId + '"]').find('.content-primary').after(
                                '<div class="box" data-comment-id="' + cleanId + '"><div class="content"><div class="box__head"><sub>ID: <span>' + cleanId.toString().substr(cleanId.length - 5) + '</span>' + ' ' + new Date(cleanCreatedDateTime).toLocaleDateString() +
                                ' ' + new Date(cleanCreatedDateTime).toLocaleTimeString() + '</sub><span class="rating">' +
                                '<button class="icon has-text-success pointer" data-attribute="likeComment" data-like-id="' + cleanId + '" data-comment-id="' + cleanId + '"><i class="fa fa-plus-square"></i></button>' + '<span class="rate__number" data-likesminusdislikes="' + cleanId + '">' + cleanLikesMinusDislikes + '</span>' +
                                '<button class="icon has-text-danger pointer" data-attribute="dislikeComment" data-dislike-id="' + cleanId + '" data-comment-id="' + cleanId + '"><i class="fa fa-minus-square"></i></button></span>' +
                                '</div><p class="comment__content">' + cleanContent + '<span class="comment-cover">' + chrome.i18n.getMessage('ShowMore') + '</span></p><div class="box__footer">' +
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
                    _this.wrapLongComments();
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

linkRev.prototype.wrapLongComments = function() {
    var maximumHeight = 150;

    $('.comment__content').each(function() {
        if ($(this).height() > maximumHeight) {
            $(this).addClass('comment__content--short');
        }
    });

    $('.comment-cover').on('click', function(){
        $(this).parent().removeClass('comment__content--short');
        $(this).remove();
    });
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

linkRev.prototype.urlify = function(context) {
    var urlRegex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig,
        _this = this;

    return context.replace(urlRegex, function(url) {
        return '<a href="' + url + '" class="external-link">' + _this.shortenUrl(url, _this.maxHrefLength) + '</a>';
    });
};

linkRev.prototype.shortenUrl = function(url, l) {
    var length = typeof(l) !== "undefined" ? l : 100,
        chunk_l = (length / 2);

    url = url.replace('http://', '').replace('https://', '');

    if (url.length <= length) {
        return url;
    } else {
        var start_chunk = this.shortString(url, chunk_l, false),
            end_chunk = this.shortString(url, chunk_l, true);

        return start_chunk + ".." + end_chunk;
    }
};

linkRev.prototype.shortString = function(string, l, reverse) {
    var stopChars = [' ','/', '&'],
        acceptableShortness = l * 0.80,
        shortString = '';

    reverse = typeof(reverse) !== 'undefined' ? reverse : false;

    if (reverse) { string = string.split('').reverse().join(''); }

    for (var i = 0; i < l - 1; i++) {
        shortString += string[i];

        if (i >= acceptableShortness && stopChars.indexOf(string[i]) >= 0) {
            break;
        }
    }

    if (reverse) { return shortString.split('').reverse().join(''); }

    return shortString;
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
            var language = _this.getCurrentLanguage(),
                country = _this.getCurrentCountry(language),
                showAll = false,
                settings = {
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