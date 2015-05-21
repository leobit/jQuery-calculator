/*
 *  Project: Leobit exchange
 *  Description: This is simple leobit/usd calculator
 *  Author: Leobit team
 *  License: MIT
 */

;(function ($, window, document, Pusher) {

    var Plugin = function (element, lChannel, bChannel, options) {
        
        this.$element = $(element);
        this.$hiddenSpan = null;
        
        this.leobitChannel = lChannel;
        this.bitstampChannel = bChannel;
        
        this.options = options;
        
        this.leoAmount = '1';
        this.usdAmount;

        this.leobitPrice;
        this.bitstampPrice;
        
        this.$leoInput = null;
        this.$usdInput = null;

        this.isLeocoinFixed = true;
        
        this.init();
    };

    Plugin.prototype = {
        
        $structure: null,
        
        init: function () {
            this.pusherInit();
            this.buildElementHtml();
            this.bindInputHandler();
            this.setInitAmount();
        },
        
        pusherInit: function() {
            this.leobitChannel.bind('finished', this.setLeobitPrice, this);
            this.bitstampChannel.bind('trade', this.setBitstampPrice, this);
        },
        
        buildElementHtml: function() {
            
            if(Plugin.prototype.$structure === null) {
                var $innerContainer = $('<div>').addClass('inner-container');
                
                var $valInputGroupLeo = $('<span>').addClass('val-input-group');
                var $leoInput = $('<input>').attr('type','text').addClass('leo-input').val('1');
                var $leoSpan = $('<span>').addClass('currency currency-leo').text('LEO');
                
                var $operator = $('<div>').addClass('operator').html('=');
                
                $valInputGroupUsd = $valInputGroupLeo.clone();
                var $usdInput = $('<input>').attr('type','text').addClass('usd-input');
                var $usdSpan = $('<span>').addClass('currency currency-usd').text('USD');
                
                var $linkDiv = $('<div>').addClass('link');
                var $link = $('<a>').attr('href', this.options.link).attr('target', '_blank');
                var $linkInner = $('<strong>').text('LEO');
                var $logo = $('<img>').attr('src', 'logo.png');
                
                var $hiddenSpan = $('<span>').addClass('hidden-input-span');
                
                $innerContainer.append(
                    $valInputGroupLeo.append(
                        $leoInput
                    ).append(
                        $leoSpan
                    )
                ).append(
                    $operator
                ).append(
                    $valInputGroupUsd.append(
                        $usdInput
                    ).append(
                        $usdSpan
                    )
                ).append(
                    $linkDiv.append(
                        $logo
                    )
                    .append(
                        $link.append(
                            $linkInner
                        ).append('bit Exchange')
                    )
                ).append($hiddenSpan); 
                
                
                Plugin.prototype.$structure = $innerContainer;
            }
            
            this.$element.addClass('element').html('').append(Plugin.prototype.$structure.clone());
            
            this.$hiddenSpan = this.$element.find('.hidden-input-span');
            this.$usdInput = this.$element.find('.usd-input');
            this.$leoInput = this.$element.find('.leo-input');
            
        },
        
        
        adjustInputSize: function() {
            this.$hiddenSpan.html(this.leoAmount);
            var spanWidth = this.$hiddenSpan.width();
            !this.leoAmount.length && spanWidth++;
            this.$leoInput.width(spanWidth);
            
            this.$hiddenSpan.html(this.usdAmount);
            spanWidth = this.$hiddenSpan.width();
            !this.usdAmount.length && spanWidth++;
            this.$usdInput.width(spanWidth);
            
        },
        
        bindInputHandler: function() {
            
            var self = this;
            
            this.$usdInput.on('input',function() {
                
                self.usdAmount = $(this).val();
                self.isLeocoinFixed = false;
                self.updateAmount();
            });
            
            this.$leoInput.on('input',function() {
                self.leoAmount = $(this).val();
                self.isLeocoinFixed = true;
                self.updateAmount();
            });
        },
        
        updateAmount: function() {
            
            if(this.isLeocoinFixed) {
                var amount = this.leoAmount * this.leobitPrice * this.bitstampPrice;
                this.usdAmount = amount.toFixed(2);
                this.$usdInput.val(this.usdAmount);
                
            } else {
                var amount = (((this.usdAmount * 100) / (this.bitstampPrice * 100)) * 100000000) / (this.leobitPrice * 100000000);
                this.leoAmount = amount.toFixed(8);
                this.$leoInput.val(this.leoAmount);
            }
            
            this.adjustInputSize();
        },
        
        setLeobitPrice: function (data) {
            console.log(data);
            if(data.currency != 'btc') return;
            this.leobitPrice = data.result[data.result.length-1].price;
            this.updateAmount();
        },
        
        setBitstampPrice: function (data) {
            this.bitstampPrice = data.price;
            this.updateAmount();
        },
        
        setInitAmount: function() {
            var self = this;
            $.ajax({
                type: 'GET',
                url: 'http://localhost/examples/getLeoPrice.php',
                dataType: 'json',
                success: function(response) {
                    self.bitstampPrice = response.bitstampPrice;
                    self.leobitPrice = response.leobitPrice;
                    self.updateAmount();
                }
            });
        }
        
    };

    $.fn.LeobitCalculator = function (options) {
        
        var leobitPusher = new Pusher("c3be11dcdb3f596d3995");
        var bitstampPusher = new Pusher("de504dc5763aeef9ff52");
        
        var leobitChannel = leobitPusher.subscribe("public");
        var bitstampChannel = bitstampPusher.subscribe("live_trades");
        
        return this.each(function() {
            
            var settings = $.extend(true, {}, $.fn.LeobitCalculator.defaults, options);
            
            var myPlugin = new Plugin(this, leobitChannel, bitstampChannel, settings);
            
        });
        
    };
    
    $.fn.LeobitCalculator.defaults = {
        link : 'https://www.leobit.net/signup/'
    };

}(jQuery, window, document, Pusher));