$(document).ready(function() {
	var borders = {
		delim: [],
		curr: 0
	};

	$(".tabs").find("li").on("click", function() {
		$(".opener").hide();
		var $t = $(this);
		var $g = $("#" + $t.parent().data().group);
		var $link = $("[data-tabname=" + $t.attr("rel") + "]");
		if ($t.hasClass("slider")) return;
		if ($link.hasClass("active-page")) return;
		console.log($g);
		$g.children().hide().removeClass("active-page");
		if (typeof $t.attr("rel") === "undefined") {
			var i = $t.index();
			$g.children().eq(i).fadeIn("fast").addClass("active-page");
		}
		$g.find("[data-tabname]").removeClass("active-page");
		if (typeof $t.data("transition") === "undefined")
			$link.slideDown("fast");
		else 
			$link.fadeIn("fast");
		$link.addClass("active-page");
		$t.addClass("selected-tab").siblings().removeClass("selected-tab");
	}).each(function() {
		var $t = $(this);
		if (!$t.index()) $t.addClass('selected-tab');
		var $g = $("#" + $t.parent().data('group'));
		$g.children(":gt(0)").hide();
		$g.children().first().addClass("active-page");
	});

	$(".slider-tabs").find("li").on("click", function() {
		var $t = $(this);
		var o = $t.offset().left - $t.parent().offset().left;
		if ($t.hasClass("slider")) return;
		var $s = $t.siblings(".slider").find("span");
		$s.animate({"left": o + $t.width()/2 + "px"}, 200, 'linear');
	});

	 $(".slider").each (function() {
		var $t = $(this);
		var $w = $t.width();
		var $l = $t.closest(".slider-tabs").children().length - 1;
		console.log($l,$w,$t);
		for (var i = 1; i <= $l; i++) {
			borders.delim.push(Math.floor((590/$l) * i));
		}
	});

	$("[data-link]").each(function() {
		var $t = $(this);
		var l = $t.data().link;
		$("<a class='article' target='_blank' href='" + l + "'>j</a>").appendTo($t);
	});
	$("h4").addClass("reveal");

	$(".reveal").each(function() {
		$(this).next("section, p").hide();
	});
	$(document).on("click", ".reveal", function() {
		var $t = $(this);
		if ($t.hasClass("open"))
			$t.removeClass("open").next("section, p").slideUp("fast");
		else{
			$t.siblings("section, p").slideUp("fast");
			$t.siblings(".reveal").removeClass("open");
			$t.addClass("open").next("section, p").slideDown("fast").addClass("shadow-paper");
		}
	});

	$("#submitme").on("click", function() {
		if (!valid())
			return;
		$("#formwrap").html("<img class='loader' src='images/365.gif' />");
		var name, email, subj, msg;
		name = $("#name").val();
		email = $("#email").val();
		subj = $("#subject").val();
		msg = $("#message").val();
		$.post("./email.php", {
			name: name,
			email: email,
			subj: subj,
			message: msg,
			sub: true
		}, function(data) {
			$("#formwrap").empty();
			$("#thankyou").text("Thanks for your message! Christie will get back to you as soon as she can.").addClass("center");
		} )
	});

	function valid() {
		return true;
	}
});