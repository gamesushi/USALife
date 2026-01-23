export default class Main extends ui.view.DefaultTheme.MainUI {
    constructor() {
        super();
        this.btnRemake.on(Laya.Event.CLICK, this, () => $ui.switchView(UI.pages.MODE));
        this.btnAchievement.on(Laya.Event.CLICK, this, () => $ui.switchView(UI.pages.ACHIEVEMENT));
        this.btnThanks.on(Laya.Event.CLICK, this, () => $ui.switchView(UI.pages.THANKS));
        this.btnGithub.on(Laya.Event.CLICK, this, goto, ['github']);
        this.btnThemes.on(Laya.Event.CLICK, this, () => $ui.showDialog(UI.pages.THEMES));
        this.btnSaveLoad.on(Laya.Event.CLICK, this, () => $ui.switchView(UI.pages.SAVELOAD));
    }

    static load() {
        return [
            "images/atlas/images/icons.atlas",
            "images/american/background.png",
        ]
    }

    init() {
        // American theme customizations
        this.btnDiscord.visible = false;
        this.banner.visible =
            this.btnAchievement.visible =
            this.btnThanks.visible = !!core.times;

        // Apply American color scheme
        const americanColors = {
            primary: "#B22234",      // Flag red
            secondary: "#3C3B6E",    // Flag blue
            accent: "#FFD700",       // Gold
            text: "#3C3B6E",         // Blue text (visible on cream background)
            buttonText: "#FFFFFF"    // White text for buttons
        };

        // Update title colors for better visibility
        if (this.labTitle) {
            this.labTitle.color = americanColors.primary;  // Red title
        }
        if (this.labSubTitle) {
            this.labSubTitle.color = americanColors.secondary;  // Blue subtitle
        }

        // Update button colors with American theme
        const applyButtonStyle = (btn) => {
            if (!btn) return;
            // Set label colors: normal, hover, pressed
            btn.labelColors = `${americanColors.buttonText},${americanColors.accent},${americanColors.buttonText}`;
            // Set button background colors
            $_.deepMapSet(btn, {
                defaultColor: americanColors.primary,
                hoverColor: americanColors.accent,
                defaultLabel: americanColors.buttonText,
                hoverLabel: americanColors.secondary,
            });
        };

        applyButtonStyle(this.btnRemake);
        applyButtonStyle(this.btnAchievement);
        applyButtonStyle(this.btnThanks);
        applyButtonStyle(this.btnGithub);
        applyButtonStyle(this.btnThemes);
        applyButtonStyle(this.btnSaveLoad);

        const text = this.labSubTitle.text;
        this.labSubTitle.text = ' ';
        this.labSubTitle.text = text;

        // Apply American theme background
        this.applyAmericanBackground();
    }

    applyAmericanBackground() {
        // Create American-themed background with proper scaling
        const bg = new Laya.Sprite();
        bg.loadImage("images/american/background.png");

        // Scale to fill the entire stage
        bg.width = Laya.stage.width;
        bg.height = Laya.stage.height;

        // Ensure it covers the full area
        bg.x = 0;
        bg.y = 0;

        // Add to the bottom layer
        this.addChildAt(bg, 0);

        // Add a semi-transparent overlay for better text readability
        const overlay = new Laya.Sprite();
        overlay.graphics.drawRect(0, 0, Laya.stage.width, Laya.stage.height, 'rgba(245, 245, 220, 0.3)');
        overlay.x = 0;
        overlay.y = 0;
        this.addChildAt(overlay, 1);
    }
}
