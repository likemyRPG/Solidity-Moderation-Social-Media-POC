import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
      primary: {
        main: '#000000', // black
      },
      secondary: {
        main: '#ffffff', // white
      },
      background: {
        default: '#ffffff', // white
        paper: '#ffffff',
      },
      text: {
        primary: '#000000', // black
      },
    },
    typography: {
      fontFamily: 'Roboto, Arial, sans-serif',
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          colorPrimary: {
            backgroundColor: '#000000', // black
            color: '#ffffff', // white
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            color: '#ffffff', // white
          },
        },
      },
    },
  });

export default theme;