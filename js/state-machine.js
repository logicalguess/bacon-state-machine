var reduce = Array.prototype.reduce;

function precompileTemplates(){
    window.TEMPLATES =
        reduce.call($("[data-template-name]"), function(templates, tag){
            tag = $(tag);
            var name = tag.attr("data-template-name");
            templates[name] = Handlebars.compile(tag.html());
            return templates;
        }, {});
}


precompileTemplates();

function click(selector){
    return $(selector).asEventStream("click");
}


var cssMapping = {
    'close': 'moon',
    'open': 'sun',
    'lock': 'lock',
    'unlock': 'unlock',
    'break': 'settings',
    'fix': 'wrench'
};

var view = {
    render: function(data) {
        for (var i in data.events) {
            data.events[i] = {
                'name': data.events[i],
                'css': cssMapping[data.events[i]]
            };
        }
        $("#state").html(TEMPLATES["state"](data.state));
        $("#events").html(template = TEMPLATES["event-list"](data));
    },
    onEvent: function() {
        return click("#events").map(".target.text.toLowerCase").map(".trim");
    }
};


var door = Stately.machine({
    'CLOSED': {
        'open':   /* => */ 'OPEN',
        'lock':   /* => */ 'LOCKED'
    },
    'OPEN': {
        'close':  /* => */ 'CLOSED'
    },
    'LOCKED': {
        'unlock': /* => */ 'CLOSED',
        'break':  /* => */ 'BROKEN'
    },
    'BROKEN': {
        'fix':  /* => */ 'OPEN'
    }
});


var transition = function (door, event) {
    console.log(door.getMachineState(), '->', event);
    return door[event]();
};

var doorStatus = function (door) {
    return {
        'state': door.getMachineState(),
        'events': door.getMachineEvents()
    }
};

//var events = Bacon.repeatedly(1000, ['close', 'lock', 'unlock', 'open']).take(8).merge(view.onEvent());

var events = view.onEvent();


//Bacon.constant(door).sampledBy(Bacon.once('close').concat(events), transition).map(doorStatus)
//    .onValue(function (value) {
//        view.render(value)
//    });

events.scan(door, transition).map(doorStatus)
    .onValue(function (value) {
        view.render(value)
    });
