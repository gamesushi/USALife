export default class Main extends ui.view.DefaultTheme.MainUI {
    constructor() {
        super();
        this.btnRemake.on(Laya.Event.CLICK, this, () => $ui.switchView(UI.pages.MODE));
        this.btnAchievement.on(Laya.Event.CLICK, this, () => $ui.switchView(UI.pages.ACHIEVEMENT));
        this.btnThanks.on(Laya.Event.CLICK, this, () => $ui.switchView(UI.pages.THANKS));
        this.btnGithub.on(Laya.Event.CLICK, this, goto, ['github']);
        this.btnThemes.on(Laya.Event.CLICK, this, () => $ui.showDialog(UI.pages.THEMES));
        this.btnSaveLoad.on(Laya.Event.CLICK, this, () => $ui.showDialog(UI.pages.SAVELOAD));
    }

    static load() {
        return [
            "images/atlas/images/icons.atlas",
        ]
    }

    init() {
        this.btnDiscord.visible = false;
        this.banner.visible =
            this.btnAchievement.visible =
            this.btnThanks.visible = !!core.times;

        // Apply vintage/retro theme colors
        const vintageColors = {
            background: "#F4E8D0",     // Warm cream
            primary: "#B8860B",         // Dark goldenrod
            secondary: "#CD853F",       // Burnt orange
            accent: "#8B4513",          // Saddle brown
            highlight: "#DAA520",       // Goldenrod
            text: "#3E2723",            // Dark brown text
            lightText: "#F4E8D0"        // Cream text for dark buttons
        };

        // Update title colors for vintage aesthetic
        if (this.labTitle) {
            this.labTitle.color = vintageColors.accent;  // Saddle brown title
        }
        if (this.labSubTitle) {
            this.labSubTitle.color = vintageColors.text;  // Dark brown subtitle
        }

        // Force refresh subtitle to apply color
        const text = this.labSubTitle.text;
        this.labSubTitle.text = ' ';
        this.labSubTitle.text = text;
    }
}
