import { AdminData } from "../TAdminData"
import { County } from "../TCounty"

export const defaultAdminObject: AdminData = {
    contractNumber: '',
    estimator: '',
    division: null,
    lettingDate: null,
    owner: null,
    county: {
        name: '',
        district: 0,
        branch: '',
        laborRate: 0,
        fringeRate: 0,
        shopRate: 0,
        flaggingRate: 0,
        flaggingBaseRate: 0,
        flaggingFringeRate: 0,
        ratedTargetGM: 0,
        nonRatedTargetGM: 0,
        insurance: 0,
        fuel: 0,
        market: 'LOCAL'
    },
    srRoute: '',
    location: '',
    dbe: '',
    startDate: null,
    endDate: null,
    winterStart: undefined,
    winterEnd: undefined,
    rated: 'RATED',
    emergencyJob: false,
    emergencyFields: {}
}