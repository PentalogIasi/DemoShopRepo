function dragEnter(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    $(evt.target).addClass('over');
}

function dragLeave(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    $(evt.target).removeClass('over');
}

function drop(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    $(evt.target).removeClass('over');

    var files = evt.originalEvent.dataTransfer.files;

    if (files.length > 0) {
        if (window.FormData !== undefined) {
            var data = new FormData();
            for (i = 0; i < files.length; i++) {
                //console.log(files[i]);
                data.append("file" + i, files[i]);
            }

            $.ajax({
                type: "POST",
                url: "/api/uploading",
                contentType: false,
                processData: false,
                data: data,
                success: function (res) {
                    $.each(res, function (i, item) {
                        //viewModel.uploads.push(item);
                    });
                }
            });
        } else {
            alert("your browser sucks!");
        }
    }
}

$(document).ready(function () {
    var $box = $("#ulbox");

    $box.bind("dragenter", dragEnter);
    $box.bind("dragleave", dragLeave);
    $box.bind("drop", drop);
});

function ViewModel() {
    var self = this;

    self.availableCategories = [
        { categoryName: "Groceries", ID:1 },
        { categoryName: "Toys", ID: 2 },
        { categoryName: "Hardware", ID: 3 }
    ];
    
    self.products = ko.observableArray(); // Contains the list of products
    self.product = ko.observable();
    self.total = ko.observable();
    self.status = ko.observable();
    self.mashups = ko.observableArray();
    self.uploads = ko.observableArray();
    self.ArrayOfModels = ko.observableArray();// = ko.mapping.fromJS([]);
    self.userdata = ko.observable();

    var creditorData = [{
        "DebtSolutionCreditorId": 3,
        "AccountNumber": "123456",
        "AmountOwed": 1000,
        "LenderId": 48,
        "NameOnAgreement": "test name",
        "Repayment": 200
    },
        {
            "DebtSolutionCreditorId": 4,
            "AccountNumber": "123456",
            "AmountOwed": 6000,
            "LenderId": 3,
            "NameOnAgreement": "test name",
            "Repayment": 200
        }];
    
    self.creditors = ko.observableArray([]);
    //creditorData = ko.toJS(creditorData);
    //ko.mapping.fromJS(creditorData, {}, self.creditors);
    
    // A nested view model that represents a single product.
    function ProductViewModel(product, initialCategory) {
        var self = this;

        self.Id = product.Id;
        self.Name = product.Name;
        self.Price = product.Price;
        self.Category = initialCategory;
        self.CategoryID = initialCategory;
        self.formattedPrice = ko.computed(function() {
            var price = product.Price;
            return price ? "$" + price.toFixed(2) : "None";
        });
    }

    //function MashupViewModel(mashup) {
    //    var self = this;
    //    self.Service = mashup.Service;
    //    self.Source = mashup.Source;
    //    self.Description = mashup.Description;
    //}

    function UploadsViewModel(upload) {
        var self = this;
        self.name = upload.name;
        self.path = upload.path;
        self.size = upload.size;
    }

    self.showTotal = ko.computed(function() {
        var total = 0;
        ko.utils.arrayForEach(self.products(), function(item) {
            var value = parseFloat(item.Price);
            if (!isNaN(value)) {
                total += value;
            }
        });
        return total.toFixed(2);
    });

    self.removeProduct = function(product) { self.products.remove(product); };

    // Get a list of all products
    self.getAll = function() {

        self.products.removeAll();
        $.getJSON("/api/products", function(products) {

            $.each(products, function(index, product) {
                var category;
                ko.utils.arrayFirst(self.availableCategories, function(item) {
                    if (item.categoryName == product.Category)
                        category = item;
                });
                self.products.push(new ProductViewModel(product, category));
            });
        });
    };

    // Find a product by product ID
    self.getById = function() {
        self.status("");
        var id = $('#productId').val();

        if (!id.length) {
            self.status("ID is required");
            return;
        }

        // Send AJX request to get the product by ID
        $.getJSON(
                'api/products/' + id,
                function(data) {
                    self.product(new ProductViewModel(data));
                    self.userdata = ko.mapping.fromJS(data);
                    //data-bind="with: userdata"
                })
            // Handler for error response:
            .fail(
                function(xhr, textStatus, err) {
                    self.product(null);
                    self.status(err);
                });
    }

    // Update product details
    self.update = function() {
        self.status("");
        var id = $('#productId').val();

        var product = {
            Name: $('#name').val(),
            Price: $('#price').val(),
            Category: $('#category option:selected').text()
        };

        $.ajax({
                url: 'api/products/' + id,
                cache: false,
                type: 'PUT',
                contentType: 'application/json; charset=utf-8',
                data: ko.toJSON(product), //JSON.stringify(product),
                success: self.getAll
            })
            .fail(
                function(xhr, textStatus, err) {
                    self.status(err);
                });
    }

    self.create = function() {
        self.status("");

        var product = {
            Name: $('#name2').val(),
            Price: $('#price2').val(),
            Category: $('#category2').val()
        };

        $.ajax({
                url: 'api/products',
                cache: false,
                type: 'POST',
                contentType: 'application/json; charset=utf-8',
                data: ko.toJSON(product), //JSON.stringify(product),
                statusCode: {
                    201 /*Created*/: function(data) {
                        var category;
                        ko.utils.arrayFirst(self.availableCategories, function(item) {
                            if (item.categoryName == data.Category)
                                category = item;
                        });
                        //var category = $.grep(self.availableCategories, function (e) { return e.categoryName == data.Category; });
                        self.products.push(new ProductViewModel(data, category)); //category[0]
                        //self.products.push(data);
                    }
                }
            })
            .fail(
                function(xhr, textStatus, err) {
                    self.status(err);
                });
    };

    //var params = {
    //    limit: this.pager.limit(),
    //    startIndex: this.pager.limit() * (this.pager.page() - 1)
    //};
    
   

    //$.getJSON("/api/mashup?topic=AT", function (mashups) {
    //    self.SuccessfullyRetrievedModelsFromAjax(mashups);
    //    $.each(mashups, function (index, mashup) {
    //        self.mashups.push(new MashupViewModel(mashup));
    //    });
    //});
    self.currentPage = ko.observable();
    self.pageSize = ko.observable(10);
    self.currentPageIndex = ko.observable(0);
    self.currentPage;
    self.resultData = ko.observable();
    self.resultData1 = ko.observable();

    $.getJSON("/api/mashup?topic=AT", function (mashups) {
        self.resultData({
            topTweets: mashups.slice(0, 50)
        });
        self.currentPage = ko.computed(function () {
            var pagesize = parseInt(self.pageSize(), 10),
            startIndex = pagesize * self.currentPageIndex(),
            endIndex = startIndex + pagesize;
            self.resultData1({
                topTweets: self.resultData().topTweets.slice(startIndex, endIndex)
            });
        });
    });

    //self.SuccessfullyRetrievedModelsFromAjax = function (models) {
    //    self.resultData({
    //        topTweets: models.slice(0,50)
    //    });
    //    //this.pager.totalCount(self.resultData().topTweets.length);
    //    //self.ArrayOfModels = ko.viewmodel.toModel(models);
    //    //ko.mapping.fromJS(models, self.ArrayOfModels);
    //};
    //self.contacts = ko.observableArray();
    
    self.nextPage = function () {
        if (((self.currentPageIndex() + 1) * self.pageSize()) < self.resultData().topTweets.length) {
            self.currentPageIndex(self.currentPageIndex() + 1);
        }
        else {
            self.currentPageIndex(0);
        }
    }
    self.previousPage = function () {
        if (self.currentPageIndex() > 0) {
            self.currentPageIndex(self.currentPageIndex() - 1);
        }
        else {
            self.currentPageIndex((Math.ceil(self.resultData().topTweets.length / self.pageSize())) - 1);
        }
    }

    $.getJSON("/api/uploading", function(uploads) {
        $.each(uploads, function(index, upload) {
            self.uploads.push(new UploadsViewModel(upload));
        });
    });

    // Initialize the view-model
    $.getJSON("/api/products", function(products) {
        self.justCategories = ko.computed(function() {
            var categories = ko.utils.arrayMap(products, function(item) {
                return { categoryName: item.Category }
            });

            return categories.sort();
        }, self);

        $.each(products, function(index, product) {
            var category;
            ko.utils.arrayFirst(self.availableCategories, function(item) {
                if (item.ID == product.CategoryID)
                    category = item;
            });
            //var category = $.grep(self.availableCategories, function (e) { return e.categoryName == product.Category; });
            self.products.push(new ProductViewModel(product, category)); // category[0]
        });
    });

    self.totalSum = ko.computed(function() {
        return 0;
    });
}

function clearStatus() {
    $('#status').html('');
}

function add() {

    clearStatus();

    var product = ko.toJS(viewModel);
    var json = ko.toJSON(product); //JSON.stringify(product);

    $.ajax({
        url: API_URL,
        cache: false,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: json,
        statusCode: {
            201 /*Created*/: function(data) {
                self.products.push(data);
            }
        }
    });
}

var viewModel = new ViewModel();
ko.applyBindings(viewModel);

// Initialize jQuery tab widget
$("#tabs").tabs();