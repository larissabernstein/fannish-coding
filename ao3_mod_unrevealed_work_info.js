(function ($) {
  // --- CONFIG ---
  var headers = [
    "Title",
    "Creator",
    "Link",
    "Recipient",
    "Posting Date",
    "creator_status",
    "collection_status",
    "unrevealed",
    "Fandoms",
    "Category",
    "Relationships",
    "Characters",
    "Tags",
    "Rating",
    "Warnings",
    "Words",
    "Chapters",
    "Summary"
  ].join(",");

  var spacer = " ";

  function csvEscape(str) {
    if (str == null) str = "";
    str = String(str);
    return '"' + str.replace(/"/g, '""') + '"';
  }

  function parseWorkPage(html) {
    var $doc = $(html);

    var fandoms = $doc.find(".fandoms a, dd.fandom.tags a.tag").map(function () {
      return $(this).text();
    }).get().join(", ");

    var category =
      $doc.find(".category .tag, dd.category.tags a.tag").map(function () {
        return $(this).text();
      }).get().join(", ");

    var rating =
      $doc.find(".rating .tag, dd.rating.tags a.tag, .required-tags .rating .text").first().text().trim();

    var warnings = $doc.find(".tags .warnings a, dd.warning.tags a.tag").map(function () {
      return $(this).text();
    }).get().join(", ");

    var relationships = $doc.find(".tags .relationships a, dd.relationship.tags a.tag").map(function () {
      return $(this).text();
    }).get().join(", ");

    var characters = $doc.find(".tags .characters a, dd.character.tags a.tag").map(function () {
      return $(this).text();
    }).get().join(", ");

    var freeforms = $doc.find(".tags .freeforms a, dd.freeform.tags a.tag").map(function () {
      return $(this).text();
    }).get().join(", ");

    var words = $doc.find("dd.words").first().text().replace(/[^\d]/g, "");
    var chapters = '="' + $doc.find("dd.chapters").first().text().trim() + '"';

    var summary = $.trim(
      $doc
        .find("blockquote.userstuff.summary, .summary .userstuff, .summary")
        .first()
        .children()
        .map(function () {
          return $(this).clone().append(spacer);
        })
        .text()
        // remove leading literal "Summary" if present
        .replace(/^summary[:\s-]*/i, "")
    );

    return {
      fandoms: fandoms,
      category: category,
      relationships: relationships,
      characters: characters,
      tags: freeforms,
      rating: rating,
      warnings: warnings,
      words: words,
      chapters: chapters,
      summary: summary
    };
  }

  function fetchWorkDetails(item) {
    return fetch(item.link, { credentials: "include" })
      .then(function (resp) { return resp.text(); })
      .then(function (html) {
        var meta = parseWorkPage(html);
        Object.assign(item, meta);
      })
      .catch(function (err) {
        console.error("Error fetching", item.link, err);
      });
  }

  // Collect base info from page
  var items = $("li.collection.item.picture.blurb.group").map(function () {
    var $li = $(this);

    var $titleLink = $li.find("> .header.module h4.heading a");
    var title = $titleLink.text().trim();
    var link = "https://archiveofourown.org" + $titleLink.attr("href");

    var $h5 = $li.find("> .header.module h5.heading").first();
    var $h5Clone = $h5.clone();
    $h5Clone.find(".recipients").remove();
    var author = $.trim($h5Clone.text().replace(/\s+/g, " "));

    var recipient = $h5.find(".recipients .user").map(function () {
      return $(this).text();
    }).get().join(", ");

    var date = $li.find("> .header.module p.datetime").text().trim();
    var creator_status = $li.find("li.user.status select option:selected").text().trim();
    var collection_status = $li.find("li.collection.status select option:selected").text().trim();
    var unrevealed = $li.find("input[type=checkbox][name$='[unrevealed]']").is(":checked")
      ? "unrevealed"
      : "revealed";

    return {
      title: title,
      author: author,
      link: link,
      recipient: recipient,
      date: date,
      creator_status: creator_status,
      collection_status: collection_status,
      unrevealed: unrevealed,

      fandoms: "",
      category: "",
      relationships: "",
      characters: "",
      tags: "",
      rating: "",
      warnings: "",
      words: "",
      chapters: "",
      summary: ""
    };
  }).get();

  if (!items.length) {
    alert("No collection items found.");
    return;
  }

  Promise.all(items.map(fetchWorkDetails)).then(function () {
    var output = headers + "\r\n";

    items.forEach(function (it) {
      var fields = [
        it.title,
        it.author,
        it.link,
        it.recipient,
        it.date,
        it.creator_status,
        it.collection_status,
        it.unrevealed,
        it.fandoms,
        it.category,
        it.relationships,
        it.characters,
        it.tags,
        it.rating,
        it.warnings,
        it.words,
        it.chapters,
        it.summary
      ].map(csvEscape);

      output += fields.join(",") + "\r\n";
    });

    var a = document.createElement("a");
    a.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent("\ufeff" + output)
    );
    a.setAttribute("download", "ao3_mod_unrevealed_work_info.csv");
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

})(jQuery);
