(function () {
    'use strict';

    // ── Word dictionary (client-side only, no network) ──────────────────────
    const WORDS = new Set([
        // 2-letter words (Ruzzle permits these)
        'aa','ab','ad','ae','ag','ah','ai','al','am','an','ar','as','at','aw','ax','ay',
        'ba','be','bi','bo','by','da','de','do','ed','ef','eh','el','em','en','er','es','et','ew','ex',
        'fa','fe','fi','go','gu','ha','he','hi','hm','ho','ia','id','if','in','is','it',
        'jo','ka','ki','ko','ky','la','li','lo','ma','me','mi','mm','mo','mu','my',
        'na','ne','no','nu','od','oe','of','oh','oi','om','on','op','or','os','ow','ox','oy',
        'pa','pe','pi','qi','re','sh','si','so','ta','te','ti','to','uh','um','un','up','us','ut',
        'we','wo','xi','xu','ya','ye','yo','za',
        // 3-letter words
        'ace','act','add','age','ago','aid','aim','air','all','and','ant','any','ape','arc','are','ark','arm','art','ash','ask','ate','axe',
        'bad','bag','ban','bar','bat','bay','bed','bee','bet','big','bin','bit','bow','box','boy','bud','bug','bus','but','buy',
        'cab','can','cap','car','cat','cop','cow','cry','cub','cup','cur','cut',
        'dad','dam','day','den','dew','did','dig','dim','dip','doe','dog','dot','dry','dub','dud','due','dug','dun','duo','dye',
        'ear','eat','eel','egg','ego','elm','emu','end','era','eve','ewe','eye',
        'fab','fad','fan','far','fat','fax','fed','fee','few','fig','fin','fir','fit','fix','fly','foe','fog','for','fox','fry','fun','fur',
        'gag','gap','gas','gem','get','gin','gnu','god','got','gum','gun','gut','guy','gym',
        'had','ham','has','hat','hay','hen','her','hew','hid','him','hip','his','hit','hoe','hog','hop','hot','how','hub','hue','hug','hum','hut',
        'ice','icy','ilk','ill','imp','ink','inn','ion','ire','irk','ivy',
        'jab','jag','jam','jar','jaw','jay','jet','jig','job','jog','jot','joy','jug','jut',
        'keg','ken','key','kid','kin','kit',
        'lab','lad','lag','lap','law','lay','lea','led','leg','let','lid','lie','lip','lit','log','lot','low','lug',
        'mad','man','map','mar','mat','maw','may','men','met','mid','mix','mob','mom','mop','mow','mud','mug','mum',
        'nab','nag','nap','net','new','nil','nip','nit','nod','nor','not','now','nub','nun','nut',
        'oak','oar','oat','odd','ode','off','oft','ohm','oil','old','one','opt','orb','ore','our','out','owe','owl','own',
        'pad','pal','pan','pap','par','pat','paw','pay','pea','peg','pen','pep','per','pet','pew','pie','pig','pin','pit','ply','pod','pop','pot','pow','pro','pry','pub','pug','pun','pup','pus','put',
        'rag','ram','ran','rap','rat','raw','ray','red','ref','rev','rib','rid','rig','rim','rip','rob','rod','rot','row','rub','rug','rum','run','rut','rye',
        'sac','sad','sag','sap','sat','saw','say','sea','set','sew','she','shy','sin','sip','sir','sis','sit','six','ski','sky','sly','sob','sod','son','sop','sot','sow','soy','spa','spy','sty','sub','sue','sum','sun','sup',
        'tab','tad','tag','tan','tap','tar','tat','tax','tea','ten','the','thy','tic','tie','tin','tip','toe','ton','too','top','tot','tow','toy','try','tub','tug','two',
        'urn','use',
        'van','vat','vet','vex','via','vie','vim','vow',
        'wad','wag','war','was','wax','way','web','wed','wet','who','why','wig','win','wit','woe','wok','won','woo','wow',
        'yak','yam','yap','yaw','yea','yes','yet','yew','you','yow',
        'zap','zed','zen','zig','zip','zoo',
        // 4-letter words
        'able','ache','acid','acre','aged','aide','ally','also','arch','area','army','atom','auto','avid','away','axle',
        'back','bait','bake','bald','ball','band','bang','bank','bare','bark','barn','base','bath','bead','beam','bean','bear','beat','been','beer','bell','belt','bend','bent','best','bias','bile','bill','bind','bird','bite','blew','blob','blow','blue','blur','boar','boat','body','bold','bolt','bomb','bond','bone','book','boom','boot','bore','born','boss','both','bowl','bulk','bull','bump','burn','burp','bush','busy','buzz',
        'cafe','cage','cake','calf','call','calm','came','camp','cane','cape','card','care','cart','case','cash','cast','cave','cell','chip','chop','cide','clad','clam','clan','clap','claw','clay','clip','clod','clog','club','clue','coal','coat','code','coil','coin','cold','cole','colt','comb','come','cone','cook','cool','cope','copy','cord','core','cork','corn','cost','coup','cove','crab','crop','crow','crud','cube','cult','curb','curd','cure','curl','cute',
        'dale','dame','damp','dare','dark','dart','dash','data','date','dawn','dead','deaf','deal','dear','deck','deed','deem','deep','deer','demo','dent','deny','desk','dial','dice','dime','dine','dirt','disc','dish','disk','dock','does','dome','done','doom','door','dose','dove','down','doze','drab','drag','draw','drew','drip','drop','drum','dual','duck','dude','duel','duet','duke','dull','dumb','dump','dune','dung','dunk','dusk','dust','duty',
        'each','earl','earn','ease','east','easy','echo','edge','edgy','edit','else','emit','envy','epic','even','ever','evil','exam','exit','eyed',
        'face','fact','fade','fail','fair','fake','fall','fame','fang','fare','farm','fast','fate','fawn','fear','feat','feed','feel','feet','fell','felt','fern','fest','feud','file','fill','film','find','fine','fire','firm','fish','fist','five','flag','flak','flap','flat','flaw','flea','fled','flew','flex','flip','flit','flog','flow','flux','foam','foil','fold','folk','fond','font','food','fool','foot','ford','fore','fork','form','fort','foul','four','fowl','free','frog','from','fuel','full','fume','fund','funk','fury','fuse','fuss','fuzz',
        'gain','gait','gale','gall','game','gape','garb','gash','gasp','gate','gave','gaze','gear','gene','gift','gild','gill','gist','give','glad','glen','glib','glob','glow','glue','glum','glut','gnat','gnaw','goad','goat','goes','gold','golf','gone','good','gore','grab','gram','gray','grin','grip','grit','grow','grub','gulf','gull','gulp','gunk','guru','gust','guts',
        'hack','hail','hair','hale','half','hall','halt','hand','hang','hare','harm','harp','hash','haste','hate','haul','have','haze','hazy','head','heal','heap','hear','heat','heed','heel','heir','held','hell','helm','help','herb','herd','here','hero','hers','hide','high','hike','hill','hilt','hind','hint','hire','hiss','hive','hoax','hold','hole','holy','home','hone','hood','hook','hoop','hope','horn','hose','host','hour','howl','huge','hull','hump','hung','hunt','hurl','hurt','hush','hymn',
        'icon','idea','idle','idol','inch',
        'jack','jade','jail','jape','java','jazz','jean','jeer','jerk','jest','jibe','jilt','jinx','jive','jock','join','joke','jolt','joss','jowl','judo','jugs','jump','june','junk','jury','just','jute',
        'keen','keep','kelp','kept','keys','kick','kill','kind','king','kiss','kite','knee','knew','knit','knob','knot','know',
        'lace','lack','lacy','laid','lair','lake','lamb','lame','lamp','land','lane','lard','lark','lash','lass','last','late','laud','lava','lawn','lead','leaf','leak','lean','leap','leer','left','lend','lens','lent','less','lest','levy','liar','lice','lick','lieu','life','lift','like','lily','limb','lime','limp','line','link','lint','lion','list','live','load','loaf','loan','lock','lode','loft','lone','long','look','loom','loop','loot','lord','lore','lorn','lose','loss','lost','loud','love','luck','lull','lump','lure','lurk','lush','lust',
        'mace','made','maid','mail','main','make','male','mall','malt','mane','many','mare','mark','mash','mask','mass','mast','mate','maze','mead','meal','mean','meat','meek','meet','meld','melt','memo','mend','menu','mere','mesh','mess','mild','mile','milk','mill','mime','mind','mine','mint','mire','miss','mist','mite','mitt','moan','moat','mock','mode','mold','mole','molt','monk','mood','moon','moor','moot','more','morn','moss','most','moth','move','much','muck','mule','mull','mumps','muse','mush','musk','must','mute','myth',
        'nail','name','nape','navy','near','neat','neck','need','nest','news','next','nice','nick','nine','node','none','noon','norm','nose','note','noun','numb',
        'oath','obey','odds','odor','ogle','ogre','okay','omen','omit','once','only','onto','oops','ooze','opal','open','oral','orca','oven','over','owed','oxen',
        'pace','pack','pact','page','paid','pail','pain','pair','pale','palm','pane','pant','pare','park','part','pass','past','path','pave','pawn','peak','peal','pear','peat','peck','peel','peer','pelt','pend','pens','pent','perk','perm','pert','pest','pick','pier','pike','pile','pill','pine','pink','pint','pipe','pity','plan','play','plea','plod','plot','plow','ploy','plug','plum','plus','pock','poem','poet','pole','poll','polo','pomp','pond','pony','pool','poor','pope','pore','pork','port','pose','posh','post','pour','pout','pray','prey','prop','prow','prude','prune','puck','pull','pulp','pump','punk','pure','purr','push',
        'quay','quiz',
        'race','rack','raft','rage','raid','rail','rain','rake','ramp','rang','rank','rant','rare','rash','rasp','rate','rave','raze','razz','read','real','reap','rear','reed','reef','reel','rein','rely','rend','rent','rest','rice','rich','ride','rift','rile','rill','rind','ring','rink','riot','ripe','rise','risk','road','roam','roar','robe','rock','rode','role','roll','romp','roof','room','root','rope','rose','rosy','rote','rout','rove','ruby','rude','ruin','rule','rump','rune','rung','rush','rust',
        'sack','safe','sage','said','sail','sake','sale','salt','same','sand','sane','sang','sank','sash','save','scab','scam','scan','scar','seal','seam','sear','seat','sect','seed','seek','seem','seen','self','sell','send','sent','sept','sewn','shed','shin','ship','shod','shoe','shoo','shop','shot','show','shun','shut','sick','side','sift','sigh','sign','silk','sill','silt','sing','sink','sire','site','size','skit','slab','slag','slam','slap','slat','slaw','slay','sled','slew','slid','slim','slip','slit','slob','sloe','slog','slop','slot','slow','slug','slum','slur','smog','snap','snag','snip','snob','snow','snub','snug','soak','soap','soar','sock','soda','sofa','soft','soil','sold','sole','some','song','soon','soot','sore','sort','soul','soup','sour','sown','span','spar','spat','spec','sped','spin','spit','spot','spry','spud','spun','spur','stab','stag','star','stay','stem','step','stew','stir','stop','stub','stud','stun','suck','suit','sulk','sump','sung','sunk','sure','surf','swan','swap','sway','swim','swum',
        'tack','tact','tail','take','tale','talk','tall','tame','tank','tape','tarn','tart','task','taxi','teak','teal','team','tear','teen','tell','temp','tend','tent','term','test','text','than','that','them','then','they','thin','this','thou','thud','thus','tick','tide','tidy','tied','tier','tile','till','tilt','time','tine','tiny','tire','toad','toes','toil','told','toll','tomb','tome','tone','took','tool','toot','tops','tore','torn','toss','tour','town','trap','tray','tree','trek','trim','trio','trip','trod','trot','true','tube','tuck','tuft','tuna','tune','turf','turn','tusk','tutu','twig','twin','type',
        'ugly','undo','unit','unto','upon','urge','used','user',
        'vail','vain','vale','vane','vary','vase','vast','veer','veil','vein','vent','verb','very','vest','veto','vice','vied','view','vile','vine','visa','void','vole','volt','vote','vouch','vow','vowed',
        'wade','wage','wail','wait','wake','walk','wall','wand','want','ward','warm','warn','warp','wart','wary','wash','wasp','wave','wavy','waxy','weak','weal','wean','wear','weed','week','well','welt','went','wept','were','west','what','when','whim','whip','whom','wick','wide','wife','wild','will','wilt','wily','wimp','wind','wine','wing','wink','wipe','wire','wise','wish','wisp','with','wits','woke','wolf','womb','wood','wool','word','wore','work','worm','worn','wort','wove','wrap','wren',
        'yank','yard','yarn','yawl','yawn','year','yell','yelp','yoga','yoke','yore','your',
        'zany','zeal','zero','zest','zinc','zing','zone','zoom',
        // 5-letter words
        'abide','about','above','abuse','acute','adapt','admit','adopt','adore','adult','agent','agile','aging','agony','agree','ahead','alarm','album','alert','alien','align','alike','alive','allow','alone','along','alter','amaze','ample','angel','anger','angle','angry','ankle','annex','antic','apart','apple','apply','arena','argue','arise','armor','aroma','array','arrow','aside','asset','atlas','attic','audio','audit','avail','avert','avoid','await','awake','award','aware','awful',
        'badge','basic','basin','basis','batch','beach','beard','beast','begin','being','below','bench','berry','bible','birth','black','blade','blame','bland','blank','blast','blaze','bleak','bleed','blend','bless','blind','blink','bliss','block','bloom','blown','blues','blunt','blush','board','boast','bonus','boost','booth','bound','brain','brand','brass','brave','bread','break','breed','brick','bride','brief','bring','broad','broke','brook','brood','broom','broth','brown','brush','buddy','build','built','bunch','burst','buyer',
        'cabin','cable','camel','candy','cargo','carry','carve','catch','cause','cedar','chain','chair','chalk','champ','chant','chaos','charm','chart','chase','cheap','cheat','check','cheek','cheer','chess','chest','chief','child','chill','china','chord','chose','chunk','civic','civil','claim','clash','clasp','class','clean','clear','clerk','click','cliff','climb','cling','cloak','clock','clone','close','cloth','cloud','clown','coach','coast','coral','count','couch','could','court','cover','crack','craft','crane','crash','crate','crawl','craze','creak','cream','creek','creep','crest','crime','crisp','cross','crowd','crown','crude','cruel','crush','curve','cycle',
        'daily','dance','death','debut','decay','decor','decoy','demon','dense','depth','derby','deter','devil','diary','dirty','ditch','dizzy','dodge','doing','donor','doubt','dough','draft','drain','drape','drawn','dream','dress','dried','drift','drill','drink','drive','drone','droit','drool','droop','drops','drown','drunk','dryer','dusty','dwarf','dwell',
        'eager','eagle','early','earth','eight','elder','elect','elite','email','ember','emery','emoji','empty','enemy','enjoy','enter','entry','epoch','equal','equip','erect','erode','error','essay','ether','evade','event','every','exact','exalt','exile','exist','expat','extra',
        'fable','facet','faith','false','fancy','fatal','fault','feast','feign','fence','ferry','fetch','fever','fiber','field','fiery','fifty','fight','filth','final','first','flame','flank','flare','flash','flask','fleet','flesh','flick','fling','flint','float','flock','flood','floor','flora','flour','flown','fluid','fluke','flung','flush','flute','focal','focus','foggy','folly','force','forge','forty','forum','fossil','found','foyer','frail','frame','fraud','fresh','front','froze','fruit','fully','fungi','funny','fuzzy',
        'gauge','genre','ghost','giant','given','glare','glass','gleam','glean','glide','globe','gloom','glory','gloss','glyph','gnome','going','goose','grace','grade','grain','grand','grant','graph','grasp','grass','grave','gravel','great','greed','green','greet','grief','grill','grind','groan','groom','grope','gross','group','grove','growl','grown','gruel','guard','guess','guest','guide','guild','guilt','guise','gulch','gully',
        'happy','harsh','haste','hasty','hatch','haunt','haven','heart','heavy','hedge','hefty','hence','heron','hinge','hobby','honey','honor','horse','hotel','house','human','humor','hurry',
        'ideal','image','imply','incur','index','inept','inert','infer','inner','input','inter','intro','ionic','irate','ivory',
        'jewel','joker','jolly','judge','juice','juicy','jumbo','jumpy',
        'kayak','kebab','knack','kneel','knelt','knock','known',
        'label','labor','laden','lance','large','laser','latch','later','laugh','layer','learn','lease','least','leave','ledge','legal','lemon','level','lever','light','lilac','limit','linen','liver','llama','lobby','local','lodge','lofty','logic','loose','lorry','lotus','louse','lousy','lover','lower','loyal','lucid','lucky','lunar','lunch','lunge',
        'magic','major','manor','maple','march','marsh','mason','match','maybe','mayor','mealy','media','mercy','merge','merit','merry','metal','meter','might','mimic','mince','minor','minus','mirth','miser','model','moist','money','month','moose','moral','morph','motel','motor','mound','mount','mourn','mouse','mouth','movie','muddy','mulch','mural','murky','music','musty',
        'naive','nasty','naval','nerve','never','newer','newly','night','noble','noise','north','notch','noted','novel','nurse',
        'oasis','occur','ocean','olive','onset','opera','orbit','order','other','otter','ought','outer','oxide',
        'panic','paper','party','pasta','paste','patch','pause','peace','peach','pearl','pedal','penal','penny','perch','peril','perky','petal','petty','phase','photo','piano','piece','pilot','pinch','pixel','pizza','place','plaid','plain','plane','plank','plant','plate','plead','pleat','plier','pluck','plumb','plume','plump','plush','poach','point','poker','polar','polka','polyp','poppy','porch','poser','posse','pouch','pound','power','prank','prawn','press','price','pride','prime','print','prior','prism','prize','probe','prone','proof','prose','proud','prove','prowl','prude','prune','psalm','pulse','punch','pupil','purge','purse',
        'quack','quail','quake','qualm','queen','query','queue','quick','quiet','quill','quirk','quota','quote',
        'radar','radio','rally','ranch','range','rapid','raven','reach','react','realm','rebel','refer','reign','relax','relay','remit','renew','repay','reply','rider','ridge','rifle','rigid','rigor','rinse','ripen','risky','rival','river','robin','robot','rocky','rogue','roomy','roost','rouge','rough','round','route','rover','royal','ruins','ruler','rumor','rural',
        'sable','saint','salad','salon','salsa','salve','sandy','sauce','sauna','scale','scare','scarf','scene','scent','scone','scope','score','scout','scrap','serve','seven','shade','shaft','shake','shall','shame','shape','share','shark','sharp','shawl','shear','sheen','sheep','sheer','sheet','shelf','shell','shift','shine','shirt','shock','shore','short','shout','shove','shown','shrub','shrug','shunt','siege','sight','sigma','since','siren','skill','skimp','skull','slain','slang','slate','slave','sleek','sleep','sleet','slice','slide','slime','sling','slope','sloth','small','smart','smear','smell','smile','smirk','smite','smith','smoke','snack','snail','snake','snare','sneak','solar','solid','solve','sonic','sorry','south','space','spare','spark','spawn','speak','spear','speed','spell','spend','spent','spice','spicy','spike','spill','spine','spoke','spook','spoon','sport','spray','squad','squid','staff','stage','stain','stair','stake','stale','stalk','stall','stamp','stand','stank','stare','stark','start','state','stave','steak','steal','steam','steel','steep','steer','stern','stick','stiff','still','sting','stink','stock','stoke','stomp','stone','stood','stool','stoop','store','stork','storm','story','stout','stove','strap','straw','stray','strip','strum','strut','stuck','study','stuff','stump','stung','stunk','style','sugar','suite','sunny','super','surge','swamp','swarm','swear','sweat','sweep','sweet','swell','swept','swift','swing','swirl','swore','sworn','swung',
        'table','taken','taste','teach','teeth','tempo','tense','tenth','thank','theme','there','thick','thief','thing','think','third','thorn','three','threw','throw','thumb','tiger','tight','timer','tired','titan','title','token','tooth','torch','total','touch','tough','tower','toxic','trace','track','trade','trail','train','trait','trash','tread','treat','trend','trial','tribe','trick','tried','trite','troll','troop','trout','truck','truly','trump','trunk','trust','truth','tulip','tumor','tuned','twice','twist',
        'ultra','uncle','under','undue','union','unite','unity','until','upper','upset','urban','usage','usher','usual','utter',
        'vague','valid','valor','value','valve','vapor','vault','verse','vigor','vinyl','viral','virus','visit','vista','vital','vivid','vocal','vogue','voice','voter','vouch',
        'wafer','wagon','waste','watch','water','weary','weave','wedge','weigh','weird','wheat','wheel','where','which','while','whine','white','whole','whose','widen','widow','width','wield','windy','witch','woman','world','worry','worse','worst','worth','would','wound','wrath','wreck','write','wrong','wrote',
        'yacht','yield','young','youth',
        'zebra','zonal',
        // 6-letter words
        'absorb','accept','access','across','action','active','actual','advice','advise','affirm','afford','agenda','almost','amount','anchor','annual','answer','anyway','appeal','appear','archer','artist','assert','assign','assist','assume','attach','attack','attain','attend','autumn',
        'barely','basket','battle','beauty','become','before','behalf','behind','belong','beside','better','beyond','bishop','blanch','border','bother','bottom','bounce','branch','breach','breath','breeze','bridge','bright','broken','broker','bronze','bruise','bubble','bucket','budget','buffer','bullet','bundle','burden','burial','buried',
        'cancel','carbon','castle','casual','caught','cellar','center','chance','change','chapel','charge','chosen','chrome','church','circle','clever','client','closet','clutch','coarse','coffee','column','combat','comedy','commit','common','compel','comply','convey','cookie','corner','costly','cotton','county','couple','course','cousin','create','credit','crisis','custom',
        'damage','danger','deadly','dealer','debate','decade','decent','defeat','defend','define','degree','demand','depart','depend','deploy','desert','design','desire','detail','detect','device','devote','dialog','differ','digest','dinner','direct','divide','domain','donate','double','dozens','dragon','drawer','driven','driver','during',
        'easily','editor','effect','effort','eighth','enable','endure','energy','engage','engine','enough','ensure','entire','entity','equity','escape','estate','exceed','except','excite','excuse','exempt','exotic','export','extend','extent','fabric',
        'facing','factor','fairly','fallen','family','famous','farmer','father','faucet','fellow','fierce','figure','filter','finger','fiscal','flavor','fleece','flight','flower','follow','forbid','forced','forest','forget','formal','former','fossil','foster','fourth','freeze','friend','frozen','fulfil','fumble',
        'gained','galaxy','gallon','gamble','garage','garden','garlic','gather','gently','gifted','ginger','global','glossy','golden','govern','gravel','grease','groove','ground','growth','guilty','gutter',
        'handle','happen','harbor','hatred','having','hazard','health','heaven','height','herbal','hidden','hollow','honest','hopper','horror','hunger','hunter','hurdle',
        'ignite','ignore','immune','impact','import','impose','income','indeed','inform','inject','injury','inland','insert','inside','insist','insure','intact','intend','intent','invest','inward','island',
        'jacket','jester','jockey','jungle','junior',
        'kidney','kernel','knight',
        'ladder','lament','laptop','lately','latest','latter','launch','lawyer','layout','leader','league','lender','lesson','letter','likely','linear','linger','liquid','listen','litter','little','lively','locker','lovely','lumber','luxury',
        'magnet','manage','manner','marble','margin','marine','market','master','matter','medium','member','memory','mental','mentor','merely','merger','method','middle','mighty','mirror','modest','modify','moment','monkey','mortal','mostly','mother','motion','motive','museum','mutual',
        'namely','narrow','nation','nature','nearby','nearly','needle','notion','number',
        'obtain','occupy','offend','office','online','oppose','option','orange','origin','outfit','outlaw','output','outrun',
        'palace','parade','parcel','parent','parrot','partly','patrol','patron','peanut','penalty','people','pepper','permit','person','phrase','piazza','picked','pillar','pillow','plague','plains','planet','player','please','pledge','plenty','plunge','pocket','poetry','poison','police','policy','polish','polite','poorly','poster','potato','potent','powder','praise','prayer','prefer','pretty','prince','prison','profit','prompt','propel','proper','pursue','puzzle',
        'quarry','quench',
        'rabbit','racism','racial','random','rarely','rather','reader','really','reason','recall','recent','record','reduce','reform','refuse','regard','regime','region','regret','reject','relate','relief','remain','remedy','remote','remove','render','rental','repair','repeat','report','resist','resort','result','retain','retire','return','reveal','review','revolt','reward','ribbon','ritual','robust','rocket','rotten','rubber','rumble',
        'sacred','safari','safety','salute','sample','saving','scheme','school','screen','script','search','season','second','secret','sector','secure','select','seller','senior','serial','series','severe','shadow','shield','should','shower','shrink','signal','silent','silver','simple','simply','singer','single','sister','sketch','sleeve','slight','smooth','soccer','socket','soften','solely','solemn','solvent','source','spirit','spread','spring','square','stable','strain','strand','streak','stream','street','stress','strict','strike','string','stroke','strong','submit','subtle','sudden','suffer','summit','summon','supply','surely','survey','switch','symbol',
        'tackle','talent','target','temple','tenant','tender','tennis','terror','thirty','though','thread','thrill','thrive','throne','ticket','timber','tissue','toggle','tongue','toward','tragic','travel','treaty','tribal','trophy','tunnel','twelve','unfair','unique','united','unless','unlike','update','uphold','upside','upwind','urgent',
        'valley','vanish','varied','vendor','vessel','viable','victim','viewer','virtue','vision','visual','volume',
        'waiver','wander','wanted','warmth','wealth','weapon','weekly','weight','wholly','wicked','widely','willed','window','winner','winter','wisdom','wonder','worker','worthy','wreath','wretch',
        'yearly',
        'zenith',
        // 7-letter words
        'ability','abolish','absence','academy','account','achieve','acquire','address','advance','adverse','adviser','already','amazing','ancient','another','anxiety','anybody','applied','arrange','article','attempt','attract','auction','average','awesome',
        'balance','banking','bargain','barrier','battery','bearing','because','bedroom','believe','beneath','benefit','besides','between','billion','blanket','blender','blossom','breathe','briefly','brutish','builder','building','burgeon',
        'cabinet','caliber','capable','capital','captain','capture','cardiac','careful','cascade','catalog','caution','ceiling','central','ceramic','certain','chamber','channel','chapter','charity','charter','chicken','chronic','circuit','citizen','classic','cleaner','clearly','climate','closest','closure','cluster','coastal','collect','college','combine','comfort','command','comment','compact','company','compare','compete','complex','compute','concern','conduct','confirm','connect','consist','consult','contact','contain','content','contest','context','control','convert','correct','council','counter','country','courage','creator','cricket','culture','cumulus','current','curtain','custody',
        'damaged','dealing','decided','decline','default','defence','deficit','deliver','density','deposit','desktop','despite','destroy','develop','devoted','digital','diploma','disable','discard','discuss','disease','dismiss','display','dispose','dispute','distant','diverse','divided','dolphin','donated','doorway','dormant','drought',
        'economy','edition','educate','elderly','element','elevate','embrace','emotion','emperor','enabled','endless','enforce','engaged','enhance','episode','equally','essence','eternal','examine','example','excited','execute','exhibit','expense','explain','exploit','explore','express','extreme',
        'factoid','faculty','failing','failure','fashion','feature','fertile','fiction','fighter','finally','finance','finding','firefly','fishing','fitness','flannel','flatten','fleeing','floating','florist','focused','forever','forgive','formula','fortune','forward','founder','fractal','freedom','freight','fulfill','funding','funeral','further',
        'gateway','genuine','glacier','glimpse','gondola','gradual','grammar','granite','graphic','gravity','greatly','grilled','grounds','growing','habitat','halfway','halting','hamster','handout','handler','hanging','happily','harbour','harmful','harmony','harvest','heading','healthy','hearing','helpful','herself','highway','himself','history','holding','holiday','horizon','hormone','hostile','housing','however','hunting','husband',
        'ignored','imagine','immense','implant','implied','imposed','improve','impulse','include','indexed','insight','inspect','install','instant','integer','intense','interim','invalid','involve','isolate',
        'journal','journey','justice','justify',
        'keeping','keynote','keyword','kitchen','knowing',
        'lacking','landing','largely','lasting','lateral','lawsuit','leading','learned','leather','leaving','lecture','legally','leisure','lending','lessons','letting','liberal','liberty','limited','linking','logical','longest','lottery','loyalty','luggage',
        'machine','manager','mandate','mansion','mapping','marital','massive','mastery','measure','medical','meeting','mention','midterm','militia','mineral','minimal','minimum','miracle','missing','mission','mistake','mixture','modular','monitor','monthly','morning','mounted','mundane','mystery',
        'natural','neglect','neither','network','notably','nothing','nuclear','nursery',
        'obvious','offense','officer','opinion','organic','outline','outside','overall','overcome','overlap','oversee',
        'package','painful','parking','partial','partner','passage','passion','patient','patriot','pattern','payload','payment','peasant','penalty','pending','pension','percent','perfect','persist','pioneer','plastic','platter','plaza','playful','pleased','pointer','polaris','polling','popular','portion','poverty','predict','premium','prepare','present','preside','prevent','primary','printer','privacy','private','proceed','produce','product','profile','program','project','promise','promote','propose','protect','protein','protest','proudly','proverb','provide','publish','pulling','purpose','pushing','putting',
        'qualify','quarter','quietly',
        'radical','rainbow','rapidly','reading','reality','realize','rebuild','receive','recover','recruit','reduced','reflect','refresh','regular','related','release','remains','removal','replace','request','require','reserve','resolve','respect','respond','restore','retreat','reunion','revenue','reverse','revival','routine',
        'sanction','satisfy','scholar','scratch','seeking','segment','sensory','serious','service','serving','session','setting','shelter','shifting','silence','similar','sincere','skilled','slavery','smoking','society','soldier','somehow','speaker','species','sponsor','squeeze','stadium','startup','station','stellar','storage','strange','student','subject','success','suggest','summary','support','supreme','surface','surgeon','surplus','survive','suspect','suspend','sustain',
        'theatre','therapy','thought','through','tobacco','tonight','totally','tourist','traffic','trainer','transit','trigger','triumph','trouble','turning','typical',
        'undergo','unfairly','uniform','unknown','unusual','upgrade','upright','utility',
        'variety','various','vehicle','venture','version','veteran','village','violent','virtual','visible','volcano','voltage','welfare','western','whether','whisper','whoever','willing','without','witness','working','worship','writing','written',
        'yearbook',
        'zealous'
    ]);

    // ── Big dictionary (words.js, loaded asynchronously so the UI starts fast) ──
    // The game always starts immediately with the built-in word list; the full
    // dictionary merges in the background if/when it loads. A submit that is not in
    // the built-in set waits for that merge before saying "Not a word", so a rare
    // word typed during the first second of a session is not rejected incorrectly.

    let dictReady = false;
    const dictWaiters = [];

    function whenDictReady() {
        if (dictReady) return Promise.resolve();
        return new Promise((resolve) => { dictWaiters.push(resolve); });
    }

    function markDictReady() {
        if (dictReady) return;
        dictReady = true;
        while (dictWaiters.length) dictWaiters.shift()();
    }

    function mergeExtras() {
        const arr = window.GAME_WORDS_EXTRA;
        if (!Array.isArray(arr)) return false;
        const lim = Math.min(arr.length, 500000);
        for (let i = 0; i < lim; i++) {
            const w = arr[i];
            if (typeof w === 'string' && w.length >= 2 && w.length <= 32) {
                WORDS.add(w.toLowerCase());
            }
        }
        window.GAME_WORDS_EXTRA = null;
        return true;
    }

    /*
     * Reports only when the optional extra word list could not be loaded.
     *
     * Silence is the success state; the one line that earns its place is the
     * failure, because it tells the player the word pool is smaller than intended.
     */
    function finishDictionary(ok) {
        markDictReady();
        const status = $('dict-status');
        if (!status) return;
        if (ok === false) {
            status.textContent = 'Extra vocabulary failed to load - common words only';
            status.classList.add('error');
        } else {
            status.textContent = '';
            status.classList.remove('error');
        }
    }

    function loadDictionary() {
        if (window.GAME_WORDS_EXTRA) {
            finishDictionary(mergeExtras());
            return;
        }
        const s = document.createElement('script');
        // Plain URL, no cache-buster. Caching is keyed on the app version by the service
        // worker's cache name, which it reads from the app's manifest.json — so there is
        // no per-game version to keep in step here. This used to be a hand-edited
        // literal that drifted from the one sw.js precached, which meant the precached
        // dictionary never matched a single real request.
        s.src = 'words.js';
        s.async = true;
        s.onload = () => { finishDictionary(mergeExtras()); };
        s.onerror = () => finishDictionary(false);
        document.head.appendChild(s);
    }

    // ── Letter pools (difficulty-based) ──────────────────────────────────────
    // Tuned ~37–39% vowels; MIXED single-J; HARD enough D + U for Q
    const POOL_EASY = 'EEEEEEEEEAAAAAAAIIIIIIOOOOOOUUUNNNNNNRRRRRRTTTTTLLLLSSSSDDDDGGGBBCCMMPPFFHHVVWWYY';
    const POOL_MIXED = 'EEEEEEEEEAAAAAAAIIIIIIIOOOOOOUUUNNNNNRRRRRTTTTTLLLLSSSSDDDGGGBBCCMMPPFFHHVVWWYYKJX';
    const POOL_HARD = 'EEEEEEEEAAAAAAAIIIIIIOOOOUUUUNNNNRRRRTTTLLLLSSSSDDDGGGBBCCMMPPFFHHVVWWYYKJQXZ';
    const VOWELS = 'aeiou';

    // ── Mode definitions ─────────────────────────────────────────────────────
    const MODES = {
        classic: { name: 'Classic', icon: '\u23F1', time: 120, xpMult: 1 },
        rush:    { name: 'Rush',    icon: '\u26A1', time: 60,  xpMult: 1.2 },
        zen:     { name: 'Zen',     icon: '\u262F', time: 0,   xpMult: 0.8 },
        challenge:{ name: 'Challenge', icon: '\u2605', time: 0, xpMult: 1.5 }
    };

    const CHALLENGE_MAX_WORDS = 15;
    const RUSH_TIME_BONUS = 8;
    const RUSH_TIME_CAP = 150;

    // ── State ───────────────────────────────────────────────────────────────
    const $ = id => document.getElementById(id);

    let grid = [];
    let gridBonus = [];
    let gridSize = 4;
    let gridEl = $('grid');
    let svg = $('path-svg');
    let timerEl = $('timer');
    let timerLabel = $('timer-label');
    let scoreEl = $('score');
    let currentWordEl = $('current-word');
    let wordActionsEl = $('word-actions');
    let btnWordSubmit = $('btn-word-submit');
    let btnWordClear = $('btn-word-clear');
    let foundListEl = $('found-list');
    let foundCountEl = $('found-count');

    let selected = [];
    let selectedSet = new Set();
    let foundWords = new Set();
    let score = 0;
    let mode = 'classic';
    let timeLeft = 120;
    let timerInterval = null;
    let isPlaying = false;
    let isDragging = false;
    let pendingStart = null;
    let dragStartPoint = { x: 0, y: 0 };
    let challengeWords = 0;
    let streak = 0;
    let bestWord = '';
    let bestWordPts = 0;
    let levelSelect = loadSelectedLevel();

    const DRAG_THRESHOLD = 8;

    // ── Screens ─────────────────────────────────────────────────────────────
    function showScreen(id) {
        ['menu-screen','game-screen','result-screen','highscore-screen'].forEach(s => {
            $(s).classList.toggle('hidden', s !== id);
        });
        document.body.classList.toggle('in-game', id === 'game-screen');
    }

    // ── Level / XP ──────────────────────────────────────────────────────────
    function getProgress() {
        try {
            const raw = JSON.parse(localStorage.getItem('wordpuzzle_progress') || '{"level":1,"xp":0}');
            if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { level: 1, xp: 0 };
            const level = Math.max(1, Math.min(9999, Math.floor(Number(raw.level)) || 1));
            const xp = Math.max(0, Math.min(1e9, Math.floor(Number(raw.xp)) || 0));
            return { level, xp };
        } catch { return { level: 1, xp: 0 }; }
    }

    function saveProgress(p) {
        try { localStorage.setItem('wordpuzzle_progress', JSON.stringify(p)); } catch {}
    }

    function xpNeededFor(level) {
        return 50 + (level - 1) * 25;
    }

    function addXp(amount) {
        const p = getProgress();
        let leveledUp = 0;
        const add = Math.max(0, Math.min(1e9, Math.floor(Number(amount)) || 0));
        p.xp = Math.min(1e9, p.xp + add);
        let guard = 0;
        while (p.xp >= xpNeededFor(p.level) && p.level < 9999 && guard < 10000) {
            p.xp -= xpNeededFor(p.level);
            p.level++;
            leveledUp++;
            guard++;
        }
        if (p.level >= 9999) p.xp = 0;
        saveProgress(p);
        return { leveledUp, level: p.level };
    }

    function getLevelConfig() {
        const level = levelSelect;
        let size = 4;
        let pool = POOL_EASY;
        if (level >= 11) size = 5;
        if (level >= 21) size = 6;
        if (level >= 6) pool = POOL_MIXED;
        if (level >= 16) pool = POOL_HARD;
        return { size, pool };
    }

    function loadSelectedLevel() {
        try {
            return Math.min(100, Math.max(1, parseInt(localStorage.getItem('wordpuzzle_level') || '1', 10) || 1));
        } catch { return 1; }
    }

    function saveSelectedLevel() {
        try { localStorage.setItem('wordpuzzle_level', String(levelSelect)); } catch {}
    }

    function setSelectedLevel(n) {
        levelSelect = Math.min(100, Math.max(1, Math.round(n) || 1));
        saveSelectedLevel();
        renderLevelPicker();
    }

    function renderLevelPicker() {
        /*
         * The difficulty number and the grid description used to be written into
         * #level-num and #level-grid-info here. Both elements were removed when the stat
         * strip took that job over — the strip says it once instead of the menu saying
         * it twice — so those writes are gone.
         *
         * Every write here is guarded because `$` is getElementById, which returns null
         * for a missing id, and assigning through that null throws.
         */
        const slider = $('level-slider');
        if (slider) slider.value = levelSelect;
        const hudLevel = $('hud-level');
        if (hudLevel) hudLevel.textContent = levelSelect;
        updateStatStrip();
    }

    function updateLevelDisplay() {
        const p = getProgress();
        const needed = xpNeededFor(p.level);
        const pct = Math.min(100, Math.round((p.xp / needed) * 100));
        $('xp-bar').style.width = pct + '%';
        $('xp-text').textContent = 'Profile Lv ' + p.level + ' \u00B7 ' + p.xp + ' / ' + needed + ' XP';
        renderLevelPicker();
        updateStatStrip();
    }

    /*
     * The menu's stat strip, mirroring Blocks' HUD bar.
     *
     * Read-only summary of state that already lives in the card list below, so it adds
     * no new sources of truth — it just surfaces them above the fold, where Blocks puts
     * its equivalents.
     */
    function updateStatStrip() {
        const p = getProgress();
        const cfg = getLevelConfig();
        const needed = xpNeededFor(p.level);
        const diff = levelSelect >= 16 ? 'Hard' : levelSelect >= 6 ? 'Medium' : 'Easy';

        const set = (id, value) => {
            const node = $(id);
            if (node) node.textContent = value;
        };

        set('strip-level', String(levelSelect));
        set('strip-diff', cfg.size + '\u00D7' + cfg.size + ' \u00B7 ' + diff);
        set('strip-profile', 'Lv ' + p.level);
        set('strip-xp', p.xp + ' / ' + needed + ' XP');
        set('strip-word', bestWord || '\u2014');
        set('strip-word-pts', bestWord ? bestWordPts + ' points' : 'No words yet');
    }

    // ── Grid Generation ─────────────────────────────────────────────────────
    function shuffleInPlace(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function pickLetters(pool, n) {
        const vPool = [];
        const cPool = [];
        for (let i = 0; i < pool.length; i++) {
            const ch = pool[i].toLowerCase();
            if (VOWELS.indexOf(ch) !== -1) vPool.push(ch);
            else cPool.push(ch);
        }
        const minV = Math.max(1, Math.round(n * 0.30));
        const maxV = Math.max(minV, Math.round(n * 0.40));
        const targetV = minV + Math.floor(Math.random() * (maxV - minV + 1));
        const letters = [];
        for (let i = 0; i < targetV; i++) {
            letters.push(vPool[Math.floor(Math.random() * vPool.length)]);
        }
        for (let i = targetV; i < n; i++) {
            letters.push(cPool[Math.floor(Math.random() * cPool.length)]);
        }
        return shuffleInPlace(letters);
    }

    function generateGrid() {
        const cfg = getLevelConfig();
        gridSize = cfg.size;
        grid = [];
        gridBonus = [];
        const letters = pickLetters(cfg.pool, gridSize * gridSize);
        let i = 0;
        for (let r = 0; r < gridSize; r++) {
            grid[r] = [];
            gridBonus[r] = [];
            for (let c = 0; c < gridSize; c++) {
                grid[r][c] = letters[i++];
                gridBonus[r][c] = null;
            }
        }
        placeBonusTiles();
        renderGrid();
    }

    function placeBonusTiles() {
        const level = levelSelect;
        const cfg = { dl: 2, tl: 2, dw: 0, tw: 0 };
        if (level >= 6)  cfg.dw = 1;
        if (level >= 11) cfg.tw = 1;
        if (gridSize >= 5) { cfg.dl += 1; cfg.tl += 1; }
        if (gridSize >= 6) { cfg.dw += 1; cfg.tl += 1; }

        const cells = [];
        for (let r = 0; r < gridSize; r++)
            for (let c = 0; c < gridSize; c++)
                cells.push([r, c]);

        // Fisher-Yates shuffle
        for (let i = cells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cells[i], cells[j]] = [cells[j], cells[i]];
        }

        const types = [];
        for (let i = 0; i < cfg.dl; i++) types.push('dl');
        for (let i = 0; i < cfg.tl; i++) types.push('tl');
        for (let i = 0; i < cfg.dw; i++) types.push('dw');
        for (let i = 0; i < cfg.tw; i++) types.push('tw');

        for (let i = 0; i < types.length; i++) {
            const [r, c] = cells[i];
            gridBonus[r][c] = types[i];
        }
    }

    function renderGrid() {
        gridEl.className = 'grid' + (gridSize === 5 ? ' size-5' : gridSize === 6 ? ' size-6' : '');
        gridEl.innerHTML = '';
        const bonusLabels = { dl:'DL', tl:'TL', dw:'DW', tw:'TW' };
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const cell = document.createElement('div');
                const bonus = gridBonus[r][c];
                cell.className = 'cell' + (bonus ? ' bonus bonus-' + bonus : '');
                cell.dataset.row = r;
                cell.dataset.col = c;
                if (bonus) {
                    const label = document.createElement('span');
                    label.className = 'bonus-label';
                    label.textContent = bonusLabels[bonus];
                    cell.appendChild(label);
                }
                const txt = document.createElement('span');
                txt.className = 'letter';
                txt.textContent = grid[r][c];
                cell.appendChild(txt);
                gridEl.appendChild(cell);
            }
        }
    }

    // ── Adjacency ───────────────────────────────────────────────────────────
    function inBounds(r, c) {
        return r >= 0 && r < gridSize && c >= 0 && c < gridSize;
    }

    function getNeighbors(r, c) {
        const neighbors = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr, nc = c + dc;
                if (inBounds(nr, nc)) neighbors.push({ row: nr, col: nc });
            }
        }
        return neighbors;
    }

    // ── Cell position helpers ───────────────────────────────────────────────
    function getCellCenter(r, c) {
        const rect = gridEl.getBoundingClientRect();
        const cells = gridEl.children;
        const cellRect = cells[r * gridSize + c].getBoundingClientRect();
        return {
            x: cellRect.left - rect.left + cellRect.width / 2,
            y: cellRect.top - rect.top + cellRect.height / 2
        };
    }

    // ── SVG Path Drawing ────────────────────────────────────────────────────
    function drawPath() {
        svg.innerHTML = '';
        for (let i = 0; i < selected.length - 1; i++) {
            const a = getCellCenter(selected[i].row, selected[i].col);
            const b = getCellCenter(selected[i + 1].row, selected[i + 1].col);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', a.x);
            line.setAttribute('y1', a.y);
            line.setAttribute('x2', b.x);
            line.setAttribute('y2', b.y);
            svg.appendChild(line);
        }
    }

    function clearPath() {
        svg.innerHTML = '';
    }

    // ── Find cell from pointer position ─────────────────────────────────────
    function cellFromPoint(x, y) {
        const el = document.elementFromPoint(x, y);
        const cell = el && el.closest ? el.closest('.cell') : null;
        if (cell && cell.classList.contains('cell') && gridEl.contains(cell)) {
            const row = parseInt(cell.dataset.row, 10);
            const col = parseInt(cell.dataset.col, 10);
            if (!Number.isFinite(row) || !Number.isFinite(col)) return null;
            return { row, col, el: cell };
        }
        return null;
    }

    function cellFromEvent(e) {
        // On pointerdown, the event target may be the cell or a child span
        if (e.target && e.target.closest) {
            const cell = e.target.closest('.cell');
            if (cell && gridEl.contains(cell)) {
                const row = parseInt(cell.dataset.row, 10);
                const col = parseInt(cell.dataset.col, 10);
                if (!Number.isFinite(row) || !Number.isFinite(col)) return null;
                return { row, col, el: cell };
            }
        }
        // During drag, find by coordinates
        if (e.clientX != null) {
            return cellFromPoint(e.clientX, e.clientY);
        }
        return null;
    }

    // ── Input Handling (Pointer Events) ─────────────────────────────────────
    function startDrag(e) {
        if (!isPlaying) return;
        e.preventDefault();
        isDragging = false;
        pendingStart = cellFromEvent(e);
        dragStartPoint = { x: e.clientX, y: e.clientY };
        try { gridEl.setPointerCapture(e.pointerId); } catch {}
    }

    function backtrackTo(cell) {
        let changed = false;
        while (selected.length > 1) {
            const last = selected[selected.length - 1];
            if (last.row === cell.row && last.col === cell.col) break;
            selected.pop();
            selectedSet.delete(last.row + ',' + last.col);
            gridEl.children[last.row * gridSize + last.col].classList.remove('selected');
            changed = true;
        }
        if (changed) { updateCurrentWord(); drawPath(); }
    }

    function moveDrag(e) {
        if (!isPlaying) return;
        if (!isDragging) {
            // Idle mouse/touch movement must never start a drag or clear the selection
            if (!(e.buttons & 1)) {
                dragStartPoint = { x: e.clientX, y: e.clientY };
                return;
            }
            const dx = (e.clientX || 0) - dragStartPoint.x;
            const dy = (e.clientY || 0) - dragStartPoint.y;
            if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
            // Is a drag: start fresh from the origin cell
            isDragging = true;
            clearSelection();
            if (pendingStart) addCell(pendingStart);
        }
        e.preventDefault();
        const cell = cellFromEvent(e);
        if (!cell) return;

        const key = cell.row + ',' + cell.col;
        if (selectedSet.has(key)) {
            backtrackTo(cell);
            return;
        }

        if (selected.length > 0) {
            const last = selected[selected.length - 1];
            const adjacent = getNeighbors(last.row, last.col).some(n => n.row === cell.row && n.col === cell.col);
            if (!adjacent) return;
        }

        addCell(cell);
    }

    function releaseGridPointer(e) {
        if (!e || e.pointerId == null) return;
        try {
            if (gridEl.hasPointerCapture?.(e.pointerId)) {
                gridEl.releasePointerCapture(e.pointerId);
            }
        } catch { /* already released */ }
    }

    function endDrag(e) {
        if (!isPlaying) return;
        if (e.preventDefault) e.preventDefault();
        if (isDragging) {
            isDragging = false;
            submitWord();
            clearSelection();
        } else {
            const cell = cellFromEvent(e) || pendingStart;
            clickSelect(cell);
        }
        releaseGridPointer(e);
    }

    function cancelDrag(e) {
        isDragging = false;
        clearSelection();
        releaseGridPointer(e);
    }

    // Click/tap: chain letters one at a time instead of dragging
    function clickSelect(cell) {
        if (!isPlaying || !cell) return;

        if (selected.length === 0) {
            clearSelection();
            addCell(cell);
            return;
        }

        const key = cell.row + ',' + cell.col;
        const last = selected[selected.length - 1];

        if (selectedSet.has(key)) {
            // Same as the last letter: deselect it; otherwise backtrack to it
            if (last.row === cell.row && last.col === cell.col) {
                selected.pop();
                selectedSet.delete(key);
                gridEl.children[last.row * gridSize + last.col].classList.remove('selected');
                clearPath();
                updateCurrentWord();
            } else {
                backtrackTo(cell);
            }
            return;
        }

        if (!getNeighbors(last.row, last.col).some(n => n.row === cell.row && n.col === cell.col)) {
            flashInvalid(gridEl.children[last.row * gridSize + last.col]);
            return;
        }

        addCell(cell);
    }

    function addCell(cell) {
        const key = cell.row + ',' + cell.col;
        if (selectedSet.has(key)) return;
        selected.push({ row: cell.row, col: cell.col });
        selectedSet.add(key);
        const el = gridEl.children[cell.row * gridSize + cell.col];
        el.classList.add('selected');
        pulseCell(el);
        updateCurrentWord();
        drawPath();
    }

    function pulseCell(el) {
        el.classList.add('pulse');
        if (el._pulseTimer) clearTimeout(el._pulseTimer);
        el._pulseTimer = setTimeout(() => {
            el.classList.remove('pulse');
            el._pulseTimer = null;
        }, 320);
    }

    function flashInvalid(el) {
        if (!el) return;
        el.classList.add('flash-error');
        setTimeout(() => el.classList.remove('flash-error'), 400);
    }

    function clearSelection() {
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const el = gridEl.children[i * gridSize + j];
                if (el) el.classList.remove('selected', 'pulse');
            }
        }
        selected = [];
        selectedSet.clear();
        clearPath();
        updateCurrentWord();
    }

    function updateCurrentWord() {
        const word = selected.map(s => grid[s.row][s.col]).join('');
        currentWordEl.textContent = word || '\u00A0';
        updateWordActions();
    }

    // Show the Submit/Clear buttons once a word has 2+ letters in click mode
    function updateWordActions() {
        const show = isPlaying && !isDragging && selected.length >= 2;
        wordActionsEl.classList.toggle('hidden', !show);
    }

    // ── Word Submission ─────────────────────────────────────────────────────
    function acceptWord(word, path) {
        foundWords.add(word);
        const pts = scoreWordRuzzle(path);
        streak++;
        const streakBonus = streak >= 3 ? Math.min(25, (streak - 2) * 3) : 0;
        const total = pts + streakBonus;
        score += total;
        scoreEl.textContent = score;
        addFoundWord(word, total, false);
        if (total > bestWordPts) {
            bestWordPts = total;
            bestWord = word;
            updateStatStrip();
        }
        showToast(
            '+' + total + ' pts' +
            (streakBonus ? ' · streak +' + streakBonus : '') +
            (streak >= 3 ? ' · x' + streak : '')
        );
        onValidWord();
    }

    function rejectWord(word, path) {
        const last = path[path.length - 1];
        if (last) {
            flashInvalid(gridEl.children[last.row * gridSize + last.col]);
        }
        addFoundWord(word, 0, true);
        showToast('Not a word', true);
        streak = 0;
    }

    function submitWord() {
        if (!isPlaying) return;
        const path = selected.slice();
        const word = path.map(s => grid[s.row][s.col]).join('');
        if (word.length < 2) return;

        if (foundWords.has(word)) {
            const last = path[path.length - 1];
            flashInvalid(gridEl.children[last.row * gridSize + last.col]);
            showToast('Already found!', true);
            streak = 0;
            return;
        }

        if (WORDS.has(word)) {
            acceptWord(word, path);
            return;
        }

        // Not in the built-in list yet — wait for words.js before rejecting, so a
        // valid rare word submitted during the async load is not scored as invalid.
        if (!dictReady) {
            showToast('Checking…');
            whenDictReady().then(() => {
                if (!isPlaying || foundWords.has(word)) return;
                if (WORDS.has(word)) acceptWord(word, path);
                else rejectWord(word, path);
            });
            return;
        }

        rejectWord(word, path);
    }

    function onValidWord() {
        if (mode === 'rush') {
            timeLeft = Math.min(RUSH_TIME_CAP, timeLeft + RUSH_TIME_BONUS);
            updateTimerDisplay();
        }
        if (mode === 'challenge') {
            challengeWords++;
            $('challenge-count').textContent = 'Words: ' + challengeWords + ' / ' + CHALLENGE_MAX_WORDS;
            if (challengeWords >= CHALLENGE_MAX_WORDS) {
                endGame();
                return;
            }
        }
    }

    function scoreWordRuzzle(path) {
        return scorePath(path, grid, gridBonus);
    }

    function scorePath(path, grid, gridBonus) {
        const LETTER_SCORES = {
            a:1,b:4,c:4,d:2,e:1,f:4,g:3,h:4,i:1,j:10,k:5,
            l:1,m:3,n:1,o:1,p:4,q:10,r:1,s:1,t:1,u:2,v:4,w:4,x:8,y:4,z:10
        };
        let letterTotal = 0, wordMult = 1;
        for (const pos of path) {
            const letter = grid[pos.row][pos.col];
            const bonus  = (gridBonus[pos.row] || [])[pos.col] || null;
            let lm = 1;
            if (bonus === 'dl') lm = 2;
            else if (bonus === 'tl') lm = 3;
            else if (bonus === 'dw') wordMult *= 2;
            else if (bonus === 'tw') wordMult *= 3;
            letterTotal += (LETTER_SCORES[letter] || 1) * lm;
        }
        const lenPts = path.length <= 4 ? 0 : (path.length - 4) * 5;
        return letterTotal * wordMult + lenPts;
    }

    /*
     * The rejected-attempt list is feedback, not progress, and Zen has no timer to
     * bound a session. Without a cap it grew for as long as the tab stayed open —
     * one <li> per guess, never trimmed until the next round. Only misses are
     * dropped; a word the player actually found always stays on the list.
     */
    const MAX_FOUND_MISSES = 40;
    let foundMisses = [];

    function addFoundWord(word, pts, invalid) {
        const li = document.createElement('li');
        li.textContent = word + (invalid ? '' : ' +' + pts);
        if (invalid) {
            li.classList.add('invalid');
            foundMisses.push(li);
            if (foundMisses.length > MAX_FOUND_MISSES) {
                foundMisses.shift().remove();
            }
        }
        foundListEl.prepend(li);
        foundCountEl.textContent = foundWords.size ? '(' + foundWords.size + ')' : '';
    }

    // ── Timer ───────────────────────────────────────────────────────────────
    function startTimer() {
        if (mode === 'zen' || mode === 'challenge') return;
        timeLeft = MODES[mode].time;
        updateTimerDisplay();
        armTimer();
    }

    /**
     * Starts the countdown from wherever `timeLeft` already is.
     *
     * Split out of startTimer() because the two callers want different things: starting a
     * round sets the clock, while coming back from a hidden tab must not — that would
     * hand the player the full time again.
     */
    function armTimer() {
        if (mode === 'zen' || mode === 'challenge') return;
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                endGame();
            }
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    /*
     * The clock stops while the tab is hidden.
     *
     * A hidden tab's interval is throttled, not suspended: browsers keep firing it, at
     * roughly once a minute in Chrome and slower still in the background, and a throttled
     * tick still decrements the clock. So a player who switches tabs for two minutes
     * returns to a round that ran while they could not see it, and a player who leaves it
     * open overnight returns to a finished game. Neither is a difficulty setting — it is
     * the tab taking their turn.
     *
     * Suspending is also the only pause this game can honestly offer. It has no pause
     * screen to show, and ending the round on hide would throw away a game the player
     * never lost. Zen and Challenge have no clock to suspend, and armTimer() declines for
     * them, so this is a no-op in those modes.
     */
    document.addEventListener('visibilitychange', () => {
        if (!isPlaying) return;
        if (document.hidden) {
            stopTimer();
        } else {
            armTimer();
        }
    });

    function updateTimerDisplay() {
        if (mode === 'zen') {
            timerEl.textContent = '\u221E';
            timerLabel.textContent = 'Relax';
            timerEl.classList.remove('warning');
            return;
        }
        if (mode === 'challenge') {
            timerEl.textContent = '--';
            timerLabel.textContent = 'Words';
            timerEl.classList.remove('warning');
            return;
        }
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        timerEl.textContent = m + ':' + String(s).padStart(2, '0');
        timerEl.classList.toggle('warning', timeLeft <= 15);
        if (mode === 'rush') updateRushBar();
    }

    // ── Rush progress bar ───────────────────────────────────────────────────
    function updateRushBar() {
        const bar = $('rush-bar');
        const fill = $('rush-fill');
        const text = $('rush-text');
        if (mode !== 'rush') {
            bar.classList.add('hidden');
            return;
        }
        bar.classList.remove('hidden');
        const pct = Math.min(100, (timeLeft / RUSH_TIME_CAP) * 100);
        fill.style.width = pct + '%';
        text.textContent = '+' + RUSH_TIME_BONUS + 's per word';
    }

    // ── Game Flow ───────────────────────────────────────────────────────────
    function startGame() {
        stopTimer();
        score = 0;
        foundWords.clear();
        challengeWords = 0;
        streak = 0;
        bestWord = '';
        bestWordPts = 0;
        scoreEl.textContent = '0';
        foundListEl.innerHTML = '';
        foundMisses = [];
        foundCountEl.textContent = '';
        currentWordEl.textContent = '\u00A0';
        updateLevelDisplay();
        generateGrid();
        isPlaying = true;

        $('hud-mode').textContent = MODES[mode].name;
        $('challenge-count').textContent = 'Words: 0 / ' + CHALLENGE_MAX_WORDS;
        $('challenge-bar').classList.toggle('hidden', mode !== 'challenge');
        $('rush-bar').classList.toggle('hidden', mode !== 'rush');
        zenEndBtn.classList.toggle('hidden', mode !== 'zen');

        showScreen('game-screen');
        updateTimerDisplay();
        updateRushBar();
        startTimer();
    }

    function endGame() {
        if (!isPlaying) return;
        stopTimer();
        isPlaying = false;
        isDragging = false;

        const base = MODES[mode].xpMult;
        const xp = Math.round(score * base);
        const result = addXp(xp);

        $('final-score-value').textContent = score;
        $('words-found-count').textContent = foundWords.size;

        const words = Array.from(foundWords);
        const longest = words.reduce((a, b) => b.length > a.length ? b : a, '');
        $('longest-word').textContent = longest || '-';
        $('best-word').textContent = bestWord ? bestWord + ' (+' + bestWordPts + ')' : '-';
        saveHighScore(mode, score, words.length);

        updateLevelDisplay();

        const progressBox = $('level-progress');
        const fill = $('level-progress-fill');
        const p = getProgress();
        const needed = xpNeededFor(p.level);
        const pct = Math.min(100, Math.round((p.xp / needed) * 100));
        progressBox.classList.remove('hidden');
        if (result.leveledUp > 0) {
            $('result-title').textContent = 'Level Up!';
            $('level-progress-text').textContent = '+' + xp + ' XP · Level ' + result.level + '!';
            fill.style.width = '0%';
            setTimeout(() => { fill.style.width = '100%'; }, 100);
        } else {
            $('result-title').textContent =
                mode === 'zen' ? 'Round Complete' :
                mode === 'challenge' ? 'Challenge Complete' :
                'Time\u2019s Up!';
            fill.style.width = pct + '%';
            $('level-progress-text').textContent = '+' + xp + ' XP · ' + p.xp + ' / ' + needed + ' toward Level ' + (p.level + 1);
        }

        showScreen('result-screen');
    }

    // ── High Scores (localStorage only) ─────────────────────────────────────
    function scoreKey(m) {
        if (!MODES[m]) m = 'classic';
        return 'wordpuzzle_scores_' + m;
    }

    function getHighScores(m) {
        m = m || mode;
        try {
            const raw = JSON.parse(localStorage.getItem(scoreKey(m)) || '[]');
            if (!Array.isArray(raw)) return [];
            return raw
                .filter(s => s && typeof s === 'object')
                .map(s => ({
                    score: Math.max(0, Math.floor(Number(s.score)) || 0),
                    words: Math.max(0, Math.floor(Number(s.words)) || 0),
                    date: String(s.date || '').slice(0, 32)
                }))
                .slice(0, 10);
        } catch { return []; }
    }

    function saveHighScore(m, sc, words) {
        const scores = getHighScores(m);
        scores.push({
            score: Math.max(0, Math.floor(Number(sc)) || 0),
            words: Math.max(0, Math.floor(Number(words)) || 0),
            date: new Date().toLocaleDateString()
        });
        scores.sort((a, b) => b.score - a.score);
        if (scores.length > 10) scores.length = 10;
        try { localStorage.setItem(scoreKey(m), JSON.stringify(scores)); } catch {}
    }

    let currentHsMode = 'classic';
    function renderHighScores() {
        const scores = getHighScores(currentHsMode);
        const list = $('highscore-list');
        const noScores = $('no-scores');
        list.innerHTML = '';
        if (scores.length === 0) {
            noScores.classList.remove('hidden');
        } else {
            noScores.classList.add('hidden');
            scores.forEach((s, i) => {
                const li = document.createElement('li');
                li.textContent = '#' + (i + 1) + ' \u2014 ' + s.score + ' pts (' + s.words + ' words) \u2014 ' + s.date;
                list.appendChild(li);
            });
        }
    }

    // ── Toast ───────────────────────────────────────────────────────────────
    let toastTimeout = null;
    function showToast(msg, isError) {
        const toast = $('toast');
        toast.textContent = msg;
        toast.className = 'toast' + (isError ? ' error' : '');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => { toast.classList.add('hidden'); }, 1500);
    }

    // ── Mode selection ──────────────────────────────────────────────────────
    let selectedMode = 'classic';

    function renderModeButtons() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === selectedMode);
        });
        const hint = $('mode-hint');
        if (hint && MODES[selectedMode]) {
            hint.textContent = MODES[selectedMode].name + ' selected \u00B7 press Play';
        }
        updateLevelDisplay();
    }

    function selectMode(m) {
        if (!MODES[m]) return;
        selectedMode = m;
        mode = m;
        renderModeButtons();
    }

    // ── Event Listeners ─────────────────────────────────────────────────────
    $('btn-play').addEventListener('click', () => {
        mode = selectedMode;
        startGame();
    });
    $('btn-replay').addEventListener('click', startGame);
    $('btn-quit').addEventListener('click', () => {
        if (!isPlaying) return;
        endGame();
    });
    $('level-minus').addEventListener('click', () => setSelectedLevel(levelSelect - 1));
    $('level-plus').addEventListener('click', () => setSelectedLevel(levelSelect + 1));
    $('level-slider').addEventListener('input', e => setSelectedLevel(parseInt(e.target.value, 10)));
    $('btn-menu').addEventListener('click', () => { renderModeButtons(); showScreen('menu-screen'); });
    $('btn-highscores').addEventListener('click', () => { currentHsMode = 'classic'; updateHsTabs(); renderHighScores(); showScreen('highscore-screen'); });
    $('btn-hs-menu').addEventListener('click', () => showScreen('menu-screen'));
    $('btn-clear-scores').addEventListener('click', () => {
        if (!window.confirm('Clear all scores, XP, and saved difficulty?')) return;
        try {
            Object.keys(MODES).forEach(m => localStorage.removeItem(scoreKey(m)));
            localStorage.removeItem('wordpuzzle_progress');
            localStorage.removeItem('wordpuzzle_level');
        } catch {}
        levelSelect = 1;
        renderHighScores();
        updateLevelDisplay();
        showToast('All data cleared');
    });

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => selectMode(btn.dataset.mode));
    });

    document.querySelectorAll('.hs-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const m = tab.dataset.hsMode;
            if (!MODES[m]) return;
            currentHsMode = m;
            updateHsTabs();
            renderHighScores();
        });
    });

    function updateHsTabs() {
        document.querySelectorAll('.hs-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.hsMode === currentHsMode);
        });
    }

    // Zen mode: end round button
    const zenEndBtn = document.createElement('button');
    zenEndBtn.className = 'btn btn-secondary hidden';
    zenEndBtn.id = 'zen-end';
    zenEndBtn.textContent = 'End Round';
    zenEndBtn.addEventListener('click', () => { if (mode === 'zen') endGame(); });
    $('game-screen').insertBefore(zenEndBtn, $('found-words'));

    // Click-mode word controls
    btnWordSubmit.addEventListener('click', () => {
        if (!isPlaying) return;
        submitWord();
        clearSelection();
    });
    btnWordClear.addEventListener('click', () => {
        if (!isPlaying) return;
        clearSelection();
    });

    // ── Grid input — Pointer Events ─────────────────────────────────────────
    gridEl.addEventListener('pointerdown', startDrag);
    gridEl.addEventListener('pointermove', moveDrag);
    gridEl.addEventListener('pointerup', endDrag);
    gridEl.addEventListener('pointercancel', cancelDrag);
    gridEl.addEventListener('contextmenu', e => e.preventDefault());

    // Keyboard: Escape to clear
    document.addEventListener('keydown', e => {
        if (isPlaying && e.key === 'Escape') clearSelection();
    });

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
    }

    // ── Init ────────────────────────────────────────────────────────────────
    showScreen('menu-screen');
    renderModeButtons();
    updateLevelDisplay();

    // Play is always enabled; the full dictionary enriches the word list in the
    // background without ever blocking the game from starting. Nothing is printed
    // while that happens — see finishDictionary() for why only failure speaks up.
    const status = $('dict-status');
    if (status) {
        status.textContent = '';
        status.classList.remove('error');
    }
    loadDictionary();

    // Published only when the card-engine test page has flagged this frame (see
    // games/cards/test/wordPuzzle.test.js). A player's browser never sets the flag.
    const isTestFrame = () => {
        try { return window.parent !== window && !!window.parent.__wordPuzzleTest; }
        catch { return false; }
    };
    if (isTestFrame()) {
        window.WordPuzzleTestHooks = {
            xpNeededFor,
            pickLetters,
            scorePath,
            isWord: (word) => WORDS.has(word),
        };
    }
})();