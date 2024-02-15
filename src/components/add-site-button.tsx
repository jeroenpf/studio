import { Icon, Modal } from '@wordpress/components';
import { tip } from '@wordpress/icons';
import { SVG, Path } from '@wordpress/primitives';
import { useI18n } from '@wordpress/react-i18n';
import { useCallback, useState } from 'react';
import { useIpcListener } from '../hooks/use-ipc-listener';
import { useSiteDetails } from '../hooks/use-site-details';
import { cx } from '../lib/cx';
import { getIpcApi } from '../lib/get-ipc-api';
import Button from './button';
import TextControlComponent from './text-control';

interface AddSiteButtonProps {
	className?: string;
}

interface FormPathInputComponentProps {
	value: string;
	onClick: () => void;
	error?: string;
	doesPathContainWordPress: boolean;
}

export const folderIcon = (
	<SVG width="16" height="16" viewBox="0 0 20 20" fill="none">
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M10.1648 6.45801L9.81934 5.76702L9.3425 4.81333C9.27192 4.67218 9.12764 4.58301 8.96982 4.58301H4.16654C3.93643 4.58301 3.74988 4.76956 3.74988 4.99967V14.7913C3.74988 15.0215 3.93643 15.208 4.16654 15.208H15.8332C16.0633 15.208 16.2499 15.0215 16.2499 14.7913V6.87467C16.2499 6.64456 16.0633 6.45801 15.8332 6.45801H10.9374H10.1648ZM10.9374 5.20801L10.4605 4.25432C10.1782 3.68968 9.60111 3.33301 8.96982 3.33301H4.16654C3.24607 3.33301 2.49988 4.0792 2.49988 4.99967V14.7913C2.49988 15.7118 3.24607 16.458 4.16654 16.458H15.8332C16.7537 16.458 17.4999 15.7118 17.4999 14.7913V6.87467C17.4999 5.9542 16.7537 5.20801 15.8332 5.20801H10.9374ZM6.67587 10.6247H6.66654V9.37467H6.67587H6.68524H6.69465H6.70411H6.71361H6.72315H6.73274H6.74238H6.75205H6.76177H6.77154H6.78134H6.79119H6.80109H6.81102H6.821H6.83102H6.84108H6.85118H6.86133H6.87151H6.88174H6.89201H6.90232H6.91267H6.92306H6.93349H6.94397H6.95448H6.96503H6.97562H6.98625H6.99692H7.00763H7.01838H7.02917H7.03999H7.05086H7.06176H7.0727H7.08368H7.0947H7.10575H7.11684H7.12797H7.13913H7.15034H7.16157H7.17285H7.18416H7.19551H7.20689H7.21831H7.22977H7.24126H7.25278H7.26434H7.27594H7.28757H7.29923H7.31093H7.32266H7.33443H7.34623H7.35807H7.36993H7.38183H7.39377H7.40574H7.41774H7.42977H7.44183H7.45393H7.46606H7.47822H7.49041H7.50263H7.51489H7.52718H7.53949H7.55184H7.56422H7.57663H7.58907H7.60154H7.61403H7.62656H7.63912H7.65171H7.66432H7.67697H7.68964H7.70235H7.71508H7.72784H7.74062H7.75344H7.76628H7.77915H7.79205H7.80498H7.81793H7.83091H7.84391H7.85694H7.87H7.88309H7.8962H7.90933H7.92249H7.93568H7.94889H7.96213H7.97539H7.98868H8.00199H8.01533H8.02869H8.04207H8.05548H8.06891H8.08236H8.09584H8.10934H8.12286H8.13641H8.14998H8.16357H8.17718H8.19082H8.20447H8.21815H8.23185H8.24557H8.25932H8.27308H8.28686H8.30067H8.31449H8.32834H8.3422H8.35609H8.36999H8.38392H8.39786H8.41182H8.4258H8.43981H8.45382H8.46786H8.48192H8.49599H8.51008H8.52419H8.53832H8.55246H8.56662H8.5808H8.595H8.60921H8.62343H8.63768H8.65194H8.66621H8.68051H8.69481H8.70914H8.72348H8.73783H8.7522H8.76658H8.78098H8.79539H8.80981H8.82425H8.8387H8.85317H8.86765H8.88214H8.89665H8.91117H8.9257H8.94025H8.9548H8.96937H8.98395H8.99855H9.01315H9.02776H9.04239H9.05703H9.07168H9.08634H9.10101H9.11569H9.13038H9.14508H9.15979H9.17451H9.18924H9.20398H9.21873H9.23348H9.24825H9.26302H9.27781H9.2926H9.3074H9.3222H9.33702H9.35184H9.36667H9.3815H9.39635H9.4112H9.42606H9.44092H9.45579H9.47066H9.48554H9.50043H9.51532H9.53022H9.54513H9.56003H9.57495H9.58986H9.60479H9.61971H9.63464H9.64958H9.66452H9.67946H9.6944H9.70935H9.7243H9.73926H9.75421H9.76917H9.78413H9.7991H9.81406H9.82903H9.844H9.85897H9.87394H9.88891H9.90389H9.91886H9.93384H9.94881H9.96379H9.97876H9.99374H10.0087H10.0237H10.0387H10.0536H10.0686H10.0836H10.0985H10.1135H10.1285H10.1434H10.1584H10.1734H10.1883H10.2033H10.2182H10.2332H10.2481H10.2631H10.278H10.2929H10.3079H10.3228H10.3377H10.3526H10.3675H10.3824H10.3973H10.4122H10.4271H10.442H10.4569H10.4718H10.4866H10.5015H10.5164H10.5312H10.5461H10.5609H10.5757H10.5905H10.6054H10.6202H10.635H10.6497H10.6645H10.6793H10.6941H10.7088H10.7236H10.7383H10.753H10.7678H10.7825H10.7972H10.8119H10.8265H10.8412H10.8559H10.8705H10.8851H10.8998H10.9144H10.929H10.9436H10.9582H10.9727H10.9873H11.0018H11.0163H11.0309H11.0454H11.0599H11.0743H11.0888H11.1033H11.1177H11.1321H11.1465H11.1609H11.1753H11.1897H11.204H11.2184H11.2327H11.247H11.2613H11.2755H11.2898H11.304H11.3183H11.3325H11.3467H11.3609H11.375H11.3892H11.4033H11.4174H11.4315H11.4455H11.4596H11.4736H11.4876H11.5016H11.5156H11.5296H11.5435H11.5574H11.5714H11.5852H11.5991H11.6129H11.6268H11.6406H11.6543H11.6681H11.6818H11.6956H11.7093H11.7229H11.7366H11.7502H11.7638H11.7774H11.791H11.8045H11.8181H11.8315H11.845H11.8585H11.8719H11.8853H11.8987H11.912H11.9254H11.9387H11.952H11.9652H11.9785H11.9917H12.0049H12.018H12.0311H12.0443H12.0573H12.0704H12.0834H12.0964H12.1094H12.1223H12.1353H12.1482H12.161H12.1739H12.1867H12.1995H12.2122H12.2249H12.2376H12.2503H12.263H12.2756H12.2881H12.3007H12.3132H12.3257H12.3382H12.3506H12.363H12.3754H12.3877H12.4001H12.4123H12.4246H12.4368H12.449H12.4612H12.4733H12.4854H12.4974H12.5095H12.5215H12.5334H12.5454H12.5572H12.5691H12.5809H12.5927H12.6045H12.6162H12.6279H12.6396H12.6512H12.6628H12.6744H12.6859H12.6974H12.7088H12.7202H12.7316H12.743H12.7543H12.7655H12.7768H12.788H12.7991H12.8102H12.8213H12.8324H12.8434H12.8544H12.8653H12.8762H12.8871H12.8979H12.9087H12.9194H12.9301H12.9408H12.9514H12.962H12.9725H12.983H12.9935H13.0039H13.0143H13.0247H13.035H13.0452H13.0555H13.0656H13.0758H13.0859H13.0959H13.1059H13.1159H13.1258H13.1357H13.1456H13.1554H13.1651H13.1749H13.1845H13.1942H13.2037H13.2133H13.2228H13.2322H13.2416H13.251H13.2603H13.2696H13.2788H13.288H13.2971H13.3062H13.3153H13.3243H13.3332V10.6247H13.3243H13.3153H13.3062H13.2971H13.288H13.2788H13.2696H13.2603H13.251H13.2416H13.2322H13.2228H13.2133H13.2037H13.1942H13.1845H13.1749H13.1651H13.1554H13.1456H13.1357H13.1258H13.1159H13.1059H13.0959H13.0859H13.0758H13.0656H13.0555H13.0452H13.035H13.0247H13.0143H13.0039H12.9935H12.983H12.9725H12.962H12.9514H12.9408H12.9301H12.9194H12.9087H12.8979H12.8871H12.8762H12.8653H12.8544H12.8434H12.8324H12.8213H12.8102H12.7991H12.788H12.7768H12.7655H12.7543H12.743H12.7316H12.7202H12.7088H12.6974H12.6859H12.6744H12.6628H12.6512H12.6396H12.6279H12.6162H12.6045H12.5927H12.5809H12.5691H12.5572H12.5454H12.5334H12.5215H12.5095H12.4974H12.4854H12.4733H12.4612H12.449H12.4368H12.4246H12.4123H12.4001H12.3877H12.3754H12.363H12.3506H12.3382H12.3257H12.3132H12.3007H12.2881H12.2756H12.263H12.2503H12.2376H12.2249H12.2122H12.1995H12.1867H12.1739H12.161H12.1482H12.1353H12.1223H12.1094H12.0964H12.0834H12.0704H12.0573H12.0443H12.0311H12.018H12.0049H11.9917H11.9785H11.9652H11.952H11.9387H11.9254H11.912H11.8987H11.8853H11.8719H11.8585H11.845H11.8315H11.8181H11.8045H11.791H11.7774H11.7638H11.7502H11.7366H11.7229H11.7093H11.6956H11.6818H11.6681H11.6543H11.6406H11.6268H11.6129H11.5991H11.5852H11.5714H11.5574H11.5435H11.5296H11.5156H11.5016H11.4876H11.4736H11.4596H11.4455H11.4315H11.4174H11.4033H11.3892H11.375H11.3609H11.3467H11.3325H11.3183H11.304H11.2898H11.2755H11.2613H11.247H11.2327H11.2184H11.204H11.1897H11.1753H11.1609H11.1465H11.1321H11.1177H11.1033H11.0888H11.0743H11.0599H11.0454H11.0309H11.0163H11.0018H10.9873H10.9727H10.9582H10.9436H10.929H10.9144H10.8998H10.8851H10.8705H10.8559H10.8412H10.8265H10.8119H10.7972H10.7825H10.7678H10.753H10.7383H10.7236H10.7088H10.6941H10.6793H10.6645H10.6497H10.635H10.6202H10.6054H10.5905H10.5757H10.5609H10.5461H10.5312H10.5164H10.5015H10.4866H10.4718H10.4569H10.442H10.4271H10.4122H10.3973H10.3824H10.3675H10.3526H10.3377H10.3228H10.3079H10.2929H10.278H10.2631H10.2481H10.2332H10.2182H10.2033H10.1883H10.1734H10.1584H10.1434H10.1285H10.1135H10.0985H10.0836H10.0686H10.0536H10.0387H10.0237H10.0087H9.99374H9.97876H9.96379H9.94881H9.93384H9.91886H9.90389H9.88891H9.87394H9.85897H9.844H9.82903H9.81406H9.7991H9.78413H9.76917H9.75421H9.73926H9.7243H9.70935H9.6944H9.67946H9.66452H9.64958H9.63464H9.61971H9.60479H9.58986H9.57495H9.56003H9.54513H9.53022H9.51532H9.50043H9.48554H9.47066H9.45579H9.44092H9.42606H9.4112H9.39635H9.3815H9.36667H9.35184H9.33702H9.3222H9.3074H9.2926H9.27781H9.26302H9.24825H9.23348H9.21873H9.20398H9.18924H9.17451H9.15979H9.14508H9.13038H9.11569H9.10101H9.08634H9.07168H9.05703H9.04239H9.02776H9.01315H8.99855H8.98395H8.96937H8.9548H8.94025H8.9257H8.91117H8.89665H8.88214H8.86765H8.85317H8.8387H8.82425H8.80981H8.79539H8.78098H8.76658H8.7522H8.73783H8.72348H8.70914H8.69481H8.68051H8.66621H8.65194H8.63768H8.62343H8.60921H8.595H8.5808H8.56662H8.55246H8.53832H8.52419H8.51008H8.49599H8.48192H8.46786H8.45382H8.43981H8.4258H8.41182H8.39786H8.38392H8.36999H8.35609H8.3422H8.32834H8.31449H8.30067H8.28686H8.27308H8.25932H8.24557H8.23185H8.21815H8.20447H8.19082H8.17718H8.16357H8.14998H8.13641H8.12286H8.10934H8.09584H8.08236H8.06891H8.05548H8.04207H8.02869H8.01533H8.00199H7.98868H7.97539H7.96213H7.94889H7.93568H7.92249H7.90933H7.8962H7.88309H7.87H7.85694H7.84391H7.83091H7.81793H7.80498H7.79205H7.77915H7.76628H7.75344H7.74062H7.72784H7.71508H7.70235H7.68964H7.67697H7.66432H7.65171H7.63912H7.62656H7.61403H7.60154H7.58907H7.57663H7.56422H7.55184H7.53949H7.52718H7.51489H7.50263H7.49041H7.47822H7.46606H7.45393H7.44183H7.42977H7.41774H7.40574H7.39377H7.38183H7.36993H7.35807H7.34623H7.33443H7.32266H7.31093H7.29923H7.28757H7.27594H7.26434H7.25278H7.24126H7.22977H7.21831H7.20689H7.19551H7.18416H7.17285H7.16157H7.15034H7.13913H7.12797H7.11684H7.10575H7.0947H7.08368H7.0727H7.06176H7.05086H7.03999H7.02917H7.01838H7.00763H6.99692H6.98625H6.97562H6.96503H6.95448H6.94397H6.93349H6.92306H6.91267H6.90232H6.89201H6.88174H6.87151H6.86133H6.85118H6.84108H6.83102H6.821H6.81102H6.80109H6.79119H6.78134H6.77154H6.76177H6.75205H6.74238H6.73274H6.72315H6.71361H6.70411H6.69465H6.68524H6.67587ZM6.66654 13.1247H6.67587H6.68524H6.69465H6.70411H6.71361H6.72315H6.73274H6.74238H6.75205H6.76177H6.77154H6.78134H6.79119H6.80109H6.81102H6.821H6.83102H6.84108H6.85118H6.86133H6.87151H6.88174H6.89201H6.90232H6.91267H6.92306H6.93349H6.94397H6.95448H6.96503H6.97562H6.98625H6.99692H7.00763H7.01838H7.02917H7.03999H7.05086H7.06176H7.0727H7.08368H7.0947H7.10575H7.11684H7.12797H7.13913H7.15034H7.16157H7.17285H7.18416H7.19551H7.20689H7.21831H7.22977H7.24126H7.25278H7.26434H7.27594H7.28757H7.29923H7.31093H7.32266H7.33443H7.34623H7.35807H7.36993H7.38183H7.39377H7.40574H7.41774H7.42977H7.44183H7.45393H7.46606H7.47822H7.49041H7.50263H7.51489H7.52718H7.53949H7.55184H7.56422H7.57663H7.58907H7.60154H7.61403H7.62656H7.63912H7.65171H7.66432H7.67697H7.68964H7.70235H7.71508H7.72784H7.74062H7.75344H7.76628H7.77915H7.79205H7.80498H7.81793H7.83091H7.84391H7.85694H7.87H7.88309H7.8962H7.90933H7.92249H7.93568H7.94889H7.96213H7.97539H7.98868H8.00199H8.01533H8.02869H8.04207H8.05548H8.06891H8.08236H8.09584H8.10934H8.12286H8.13641H8.14998H8.16357H8.17718H8.19082H8.20447H8.21815H8.23185H8.24557H8.25932H8.27308H8.28686H8.30067H8.31449H8.32834H8.3422H8.35609H8.36999H8.38392H8.39786H8.41182H8.4258H8.43981H8.45382H8.46786H8.48192H8.49599H8.51008H8.52419H8.53832H8.55246H8.56662H8.5808H8.595H8.60921H8.62343H8.63768H8.65194H8.66621H8.68051H8.69481H8.70914H8.72348H8.73783H8.7522H8.76658H8.78098H8.79539H8.80981H8.82425H8.8387H8.85317H8.86765H8.88214H8.89665H8.91117H8.9257H8.94025H8.9548H8.96937H8.98395H8.99855H9.01315H9.02776H9.04239H9.05703H9.07168H9.08634H9.10101H9.11569H9.13038H9.14508H9.15979H9.17451H9.18924H9.20398H9.21873H9.23348H9.24825H9.26302H9.27781H9.2926H9.3074H9.3222H9.33702H9.35184H9.36667H9.3815H9.39635H9.4112H9.42606H9.44092H9.45579H9.47066H9.48554H9.50043H9.51532H9.53022H9.54513H9.56003H9.57495H9.58986H9.60479H9.61971H9.63464H9.64958H9.66452H9.67946H9.6944H9.70935H9.7243H9.73926H9.75421H9.76917H9.78413H9.7991H9.81406H9.82903H9.844H9.85897H9.87394H9.88891H9.90389H9.91886H9.93384H9.94881H9.96379H9.97876H9.99374H10.0087H10.0237H10.0387H10.0536H10.0686H10.0836H10.0985H10.1135H10.1285H10.1434H10.1584H10.1734H10.1883H10.2033H10.2182H10.2332H10.2481H10.2631H10.278H10.2929H10.3079H10.3228H10.3377H10.3526H10.3675H10.3824H10.3973H10.4122H10.4271H10.442H10.4569H10.4718H10.4866H10.5015H10.5164H10.5312H10.5461H10.5609H10.5757H10.5905H10.6054H10.6202H10.635H10.6497H10.6645H10.6793H10.6941H10.7088H10.7236H10.7383H10.753H10.7678H10.7825H10.7972H10.8119H10.8265H10.8412H10.8559H10.8705H10.8851H10.8998H10.9144H10.929H10.9436H10.9582H10.9727H10.9873H11.0018H11.0163H11.0309H11.0454H11.0599H11.0743H11.0888H11.1033H11.1177H11.1321H11.1465H11.1609H11.1753H11.1897H11.204H11.2184H11.2327H11.247H11.2613H11.2755H11.2898H11.304H11.3183H11.3325H11.3467H11.3609H11.375H11.3892H11.4033H11.4174H11.4315H11.4455H11.4596H11.4736H11.4876H11.5016H11.5156H11.5296H11.5435H11.5574H11.5714H11.5852H11.5991H11.6129H11.6268H11.6406H11.6543H11.6681H11.6818H11.6956H11.7093H11.7229H11.7366H11.7502H11.7638H11.7774H11.791H11.8045H11.8181H11.8315H11.845H11.8585H11.8719H11.8853H11.8987H11.912H11.9254H11.9387H11.952H11.9652H11.9785H11.9917H12.0049H12.018H12.0311H12.0443H12.0573H12.0704H12.0834H12.0964H12.1094H12.1223H12.1353H12.1482H12.161H12.1739H12.1867H12.1995H12.2122H12.2249H12.2376H12.2503H12.263H12.2756H12.2881H12.3007H12.3132H12.3257H12.3382H12.3506H12.363H12.3754H12.3877H12.4001H12.4123H12.4246H12.4368H12.449H12.4612H12.4733H12.4854H12.4974H12.5095H12.5215H12.5334H12.5454H12.5572H12.5691H12.5809H12.5927H12.6045H12.6162H12.6279H12.6396H12.6512H12.6628H12.6744H12.6859H12.6974H12.7088H12.7202H12.7316H12.743H12.7543H12.7655H12.7768H12.788H12.7991H12.8102H12.8213H12.8324H12.8434H12.8544H12.8653H12.8762H12.8871H12.8979H12.9087H12.9194H12.9301H12.9408H12.9514H12.962H12.9725H12.983H12.9935H13.0039H13.0143H13.0247H13.035H13.0452H13.0555H13.0656H13.0758H13.0859H13.0959H13.1059H13.1159H13.1258H13.1357H13.1456H13.1554H13.1651H13.1749H13.1845H13.1942H13.2037H13.2133H13.2228H13.2322H13.2416H13.251H13.2603H13.2696H13.2788H13.288H13.2971H13.3062H13.3153H13.3243H13.3332V11.8747H13.3243H13.3153H13.3062H13.2971H13.288H13.2788H13.2696H13.2603H13.251H13.2416H13.2322H13.2228H13.2133H13.2037H13.1942H13.1845H13.1749H13.1651H13.1554H13.1456H13.1357H13.1258H13.1159H13.1059H13.0959H13.0859H13.0758H13.0656H13.0555H13.0452H13.035H13.0247H13.0143H13.0039H12.9935H12.983H12.9725H12.962H12.9514H12.9408H12.9301H12.9194H12.9087H12.8979H12.8871H12.8762H12.8653H12.8544H12.8434H12.8324H12.8213H12.8102H12.7991H12.788H12.7768H12.7655H12.7543H12.743H12.7316H12.7202H12.7088H12.6974H12.6859H12.6744H12.6628H12.6512H12.6396H12.6279H12.6162H12.6045H12.5927H12.5809H12.5691H12.5572H12.5454H12.5334H12.5215H12.5095H12.4974H12.4854H12.4733H12.4612H12.449H12.4368H12.4246H12.4123H12.4001H12.3877H12.3754H12.363H12.3506H12.3382H12.3257H12.3132H12.3007H12.2881H12.2756H12.263H12.2503H12.2376H12.2249H12.2122H12.1995H12.1867H12.1739H12.161H12.1482H12.1353H12.1223H12.1094H12.0964H12.0834H12.0704H12.0573H12.0443H12.0311H12.018H12.0049H11.9917H11.9785H11.9652H11.952H11.9387H11.9254H11.912H11.8987H11.8853H11.8719H11.8585H11.845H11.8315H11.8181H11.8045H11.791H11.7774H11.7638H11.7502H11.7366H11.7229H11.7093H11.6956H11.6818H11.6681H11.6543H11.6406H11.6268H11.6129H11.5991H11.5852H11.5714H11.5574H11.5435H11.5296H11.5156H11.5016H11.4876H11.4736H11.4596H11.4455H11.4315H11.4174H11.4033H11.3892H11.375H11.3609H11.3467H11.3325H11.3183H11.304H11.2898H11.2755H11.2613H11.247H11.2327H11.2184H11.204H11.1897H11.1753H11.1609H11.1465H11.1321H11.1177H11.1033H11.0888H11.0743H11.0599H11.0454H11.0309H11.0163H11.0018H10.9873H10.9727H10.9582H10.9436H10.929H10.9144H10.8998H10.8851H10.8705H10.8559H10.8412H10.8265H10.8119H10.7972H10.7825H10.7678H10.753H10.7383H10.7236H10.7088H10.6941H10.6793H10.6645H10.6497H10.635H10.6202H10.6054H10.5905H10.5757H10.5609H10.5461H10.5312H10.5164H10.5015H10.4866H10.4718H10.4569H10.442H10.4271H10.4122H10.3973H10.3824H10.3675H10.3526H10.3377H10.3228H10.3079H10.2929H10.278H10.2631H10.2481H10.2332H10.2182H10.2033H10.1883H10.1734H10.1584H10.1434H10.1285H10.1135H10.0985H10.0836H10.0686H10.0536H10.0387H10.0237H10.0087H9.99374H9.97876H9.96379H9.94881H9.93384H9.91886H9.90389H9.88891H9.87394H9.85897H9.844H9.82903H9.81406H9.7991H9.78413H9.76917H9.75421H9.73926H9.7243H9.70935H9.6944H9.67946H9.66452H9.64958H9.63464H9.61971H9.60479H9.58986H9.57495H9.56003H9.54513H9.53022H9.51532H9.50043H9.48554H9.47066H9.45579H9.44092H9.42606H9.4112H9.39635H9.3815H9.36667H9.35184H9.33702H9.3222H9.3074H9.2926H9.27781H9.26302H9.24825H9.23348H9.21873H9.20398H9.18924H9.17451H9.15979H9.14508H9.13038H9.11569H9.10101H9.08634H9.07168H9.05703H9.04239H9.02776H9.01315H8.99855H8.98395H8.96937H8.9548H8.94025H8.9257H8.91117H8.89665H8.88214H8.86765H8.85317H8.8387H8.82425H8.80981H8.79539H8.78098H8.76658H8.7522H8.73783H8.72348H8.70914H8.69481H8.68051H8.66621H8.65194H8.63768H8.62343H8.60921H8.595H8.5808H8.56662H8.55246H8.53832H8.52419H8.51008H8.49599H8.48192H8.46786H8.45382H8.43981H8.4258H8.41182H8.39786H8.38392H8.36999H8.35609H8.3422H8.32834H8.31449H8.30067H8.28686H8.27308H8.25932H8.24557H8.23185H8.21815H8.20447H8.19082H8.17718H8.16357H8.14998H8.13641H8.12286H8.10934H8.09584H8.08236H8.06891H8.05548H8.04207H8.02869H8.01533H8.00199H7.98868H7.97539H7.96213H7.94889H7.93568H7.92249H7.90933H7.8962H7.88309H7.87H7.85694H7.84391H7.83091H7.81793H7.80498H7.79205H7.77915H7.76628H7.75344H7.74062H7.72784H7.71508H7.70235H7.68964H7.67697H7.66432H7.65171H7.63912H7.62656H7.61403H7.60154H7.58907H7.57663H7.56422H7.55184H7.53949H7.52718H7.51489H7.50263H7.49041H7.47822H7.46606H7.45393H7.44183H7.42977H7.41774H7.40574H7.39377H7.38183H7.36993H7.35807H7.34623H7.33443H7.32266H7.31093H7.29923H7.28757H7.27594H7.26434H7.25278H7.24126H7.22977H7.21831H7.20689H7.19551H7.18416H7.17285H7.16157H7.15034H7.13913H7.12797H7.11684H7.10575H7.0947H7.08368H7.0727H7.06176H7.05086H7.03999H7.02917H7.01838H7.00763H6.99692H6.98625H6.97562H6.96503H6.95448H6.94397H6.93349H6.92306H6.91267H6.90232H6.89201H6.88174H6.87151H6.86133H6.85118H6.84108H6.83102H6.821H6.81102H6.80109H6.79119H6.78134H6.77154H6.76177H6.75205H6.74238H6.73274H6.72315H6.71361H6.70411H6.69465H6.68524H6.67587H6.66654V13.1247Z"
			fill="#3C434A"
		/>
	</SVG>
);

function FormPathInputComponent( {
	value,
	onClick,
	error,
	doesPathContainWordPress,
}: FormPathInputComponentProps ) {
	const { __ } = useI18n();
	return (
		<div className="flex flex-col">
			<div className="flex flex-row">
				<TextControlComponent
					disabled={ true }
					className="[&_input]:!rounded-l-sm [&_input]:!rounded-r-none [&_input]:!bg-white w-full"
					value={ value }
					// eslint-disable-next-line @typescript-eslint/no-empty-function
					onChange={ () => {} }
				/>
				<div
					data-testid="select-path-button"
					onClick={ onClick }
					className="flex items-center py-[9px] px-2.5 border border-y-[#949494] border-r-[#949494] rounded-l-none rounded-r-sm cursor-pointer"
				>
					{ folderIcon }
				</div>
			</div>
			{ ( error || doesPathContainWordPress ) && (
				<div
					className={ cx(
						'flex flex-row items-center a8c-helper-text pt-1.5',
						error ? 'text-red-500' : '',
						doesPathContainWordPress ? 'text-a8c-gray-70' : ''
					) }
				>
					<Icon className={ error ? 'fill-red-500' : '' } icon={ tip } width={ 14 } height={ 14 } />
					<p>{ error ? error : __( 'The existing WordPress site at this path will be added.' ) }</p>
				</div>
			) }
		</div>
	);
}

export default function AddSiteButton( { className }: AddSiteButtonProps ) {
	const { __ } = useI18n();
	const { createSite, data } = useSiteDetails();
	const [ addSiteError, setAddSiteError ] = useState( '' );
	const [ needsToAddSite, setNeedsToAddSite ] = useState( false );
	const [ isAddingSite, setIsAddingSite ] = useState( false );
	const [ siteName, setSiteName ] = useState( '' );
	const [ sitePath, setSitePath ] = useState( '' );
	const [ doesPathContainWordPress, setDoesPathContainWordPress ] = useState( false );

	const onSelectPath = useCallback( async () => {
		const response = await getIpcApi().showOpenFolderDialog( __( 'Choose folder for site' ) );
		if ( response?.path ) {
			const { path, name, isEmpty: isEmptyPath, isWordPress } = response;
			setDoesPathContainWordPress( false );
			setAddSiteError( '' );
			setSitePath( path );
			const allPaths = data.map( ( site ) => site.path );
			if ( allPaths.includes( path ) ) {
				setAddSiteError( __( 'Another site already exists at this path.' ) );
				return;
			}
			if ( ! isEmptyPath && ! isWordPress ) {
				setAddSiteError( __( 'This path does not contain a WordPress site.' ) );
				return;
			}
			setDoesPathContainWordPress( ! isEmptyPath && isWordPress );
			if ( ! siteName ) {
				setSiteName( name ?? '' );
			}
		}
	}, [ __, data, siteName ] );

	useIpcListener( 'add-site', () => {
		setNeedsToAddSite( true );
	} );

	className = cx(
		'!ring-1 !ring-inset ring-white text-white hover:bg-gray-100 hover:text-black',
		className
	);

	const resetLocalState = useCallback( () => {
		setNeedsToAddSite( false );
		setSiteName( '' );
		setSitePath( '' );
		setAddSiteError( '' );
		setDoesPathContainWordPress( false );
	}, [] );

	const onSiteAdd = useCallback( async () => {
		setIsAddingSite( true );
		try {
			await createSite( sitePath, siteName );
			setNeedsToAddSite( false );
			resetLocalState();
		} catch ( e ) {
			setAddSiteError( ( e as Error )?.message );
		}
		setIsAddingSite( false );
	}, [ createSite, resetLocalState, siteName, sitePath ] );

	return (
		<>
			{ needsToAddSite && (
				<Modal
					className="[&_h1]:!text-xl [&_h1]:!font-normal min-w-[460px] max-w-full outline-0"
					title={ __( 'Add a site' ) }
					closeButtonLabel={ __( 'Add' ) }
					isDismissible
					onRequestClose={ resetLocalState }
				>
					<div className="flex flex-col gap-6">
						<label className="flex flex-col gap-1.5 leading-4">
							<span className="font-semibold">{ __( 'Site name' ) }</span>
							<TextControlComponent
								onChange={ setSiteName }
								value={ siteName }
							></TextControlComponent>
						</label>
						<label className="flex flex-col gap-1.5 leading-4">
							<span className="font-semibold">{ __( 'Local path' ) }</span>
							<FormPathInputComponent
								doesPathContainWordPress={ doesPathContainWordPress }
								error={ addSiteError }
								value={ sitePath }
								onClick={ onSelectPath }
							/>
						</label>
					</div>
					<div className="flex flex-row justify-end gap-x-5 mt-6">
						<Button onClick={ resetLocalState } disabled={ isAddingSite } variant="tertiary">
							{ __( 'Cancel' ) }
						</Button>
						<Button
							data-testid="add-site-button"
							disabled={ isAddingSite || ! siteName || ! sitePath }
							variant="primary"
							className="bg-a8c-blueberry hover:text-white text-white"
							onClick={ onSiteAdd }
						>
							{ __( 'Add site' ) }
						</Button>
					</div>
				</Modal>
			) }
			<Button className={ className } onClick={ () => setNeedsToAddSite( true ) }>
				{ __( 'Add site' ) }
			</Button>
		</>
	);
}
