# Images Directory

This folder contains static images used throughout the application.

## Structure

```
images/
├── auth/           # Login, signup, password reset backgrounds
├── logos/          # Company logos and branding
├── icons/          # Custom icons and favicons
└── placeholders/   # Placeholder images
```

## Usage

### For images in /public/images:
```jsx
// Reference from HTML or public folder
<img src="/images/auth/login-bg.jpg" alt="Login background" />
```

### For images in /src/assets/images:
```jsx
// Import in React components
import loginBg from '../../assets/images/auth/login-bg.jpg';
<img src={loginBg} alt="Login background" />
```

## Best Practices

1. **Optimize images** before adding (compress, resize)
2. **Use descriptive names** (e.g., `login-background.jpg` not `img1.jpg`)
3. **Recommended formats:**
   - Photos/backgrounds: `.jpg` or `.webp`
   - Graphics/logos: `.png` or `.svg`
4. **Keep file sizes small** (< 500KB for backgrounds)
