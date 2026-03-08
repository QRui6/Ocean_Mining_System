/**
 * 管理框架组织结构数据
 */

// 美国管理框架
export const usaFramework = {
    name: '美国自然科学基金会（NSF）',
    nameEn: 'National Science Foundation',
    color: '#90EE90',
    children: [
        {
            name: '美国IODP办公室',
            color: '#FFE4B5',
            children: [
                {
                    name: '设在哥伦比亚大学，负责组织航次实施和航次后研究',
                    color: '#E0F7E0',
                    clickable: false
                }
            ]
        },
        {
            name: '美国得克萨斯农工大学',
            color: '#FFE4B5',
            children: [
                {
                    name: '"决心"号平台管理委员会（JRFB）',
                    color: '#FFB6A3',
                    children: [
                        {
                            name: '由12家机构的代表组成，负责航次安排',
                            color: '#E0F7E0',
                            description: '负责航次安排'
                        }
                    ]
                },
                {
                    name: '岩芯库',
                    color: '#FFB6A3',
                    children: [
                    ]
                },
                {
                    name: '"决心"号科学服务中心',
                    color: '#FFB6A3',
                    children: [
                        {
                            name: '负责平台运行管理；下设科学运营处、实验技术分析处、信息数据处、出版处',
                            color: '#E0F7E0',
                            description: '平台运行、科学运营、实验分析、数据管理'
                        },
                        {
                            name: '钻探业务外包给"ODL"钻探公司',
                            color: '#E0F7E0',
                            description: '钻探业务外包'
                        },
                        {
                            name: '测井业务外包给斯伦贝谢公司',
                            color: '#E0F7E0',
                            description: '测井业务外包'
                        }
                    ]
                }
            ]
        },
        {
            name: '科学咨询委员会',
            color: '#FFE4B5',
            children: [
                {
                    name: '负责评审IODP建议书',
                    color: '#E0F7E0',
                    clickable: false
                }
            ]
        }
    ]
};

// 日本管理框架
export const japanFramework = {
    name: '日本文部科学省',
    nameEn: 'Ministry of Education, Culture, Sports, Science and Technology',
    color: '#B0E0E6',
    children: [
        {
            name: '日本海洋科技中心（JAMSTEC）',
            nameEn: 'Japan Agency for Marine-Earth Science and Technology',
            color: '#B0E0E6',
            children: [
                {
                    name: '日本地球科学联盟（J-DESC）',
                    color: '#F5DEB3',
                    children: [
                        {
                            name: '由50家高校和研究机构组成，负责组织联络',
                            color: '#E0F7E0',
                            description: '组织联络'
                        }
                    ]
                },
                {
                    name: '"地球"号管理委员会（CIB）',
                    color: '#F5DEB3',
                    children: [
                        {
                            name: '由6位科学家组成，负责审核IODP建议书',
                            color: '#E0F7E0',
                            description: '审核建议书'
                        }
                    ]
                },
                {
                    name: '海洋与地球勘探工程研究所（MarE3）',
                    nameEn: 'Marine Engineering Research Institute',
                    color: '#FFD700',
                    children: [
                        {
                            name: '负责JAMSTEC所有研究平台和设备的管理，以及钻探和调查技术研发',
                            color: '#E0F7E0',
                            description: '平台管理、技术研发'
                        }
                    ]
                },
                {
                    name: '高知岩心中心（KCC）',
                    nameEn: 'Kochi Core Center',
                    color: '#98FB98',
                    children: [
                        {
                            name: '高知海洋岩心研究中心（CMCR，高知大学成立）',
                            color: '#E0F7E0',
                            description: '岩芯研究'
                        },
                        {
                            name: '高知岩心样品研究所（JAMSTEC成立）',
                            color: '#E0F7E0',
                            description: '样品研究'
                        }
                    ]
                },
                {
                    name: '委托MQJ公司运维"地球"号，包括船舶操作和钻探作业技术人员调配和管理',
                    color: '#B0E0E6',
                    clickable: false
                },
                {
                    name: '委托NMJ公司负责"地球"号船舶实验室维护和实验人员调配管理',
                    color: '#B0E0E6',
                    clickable: false
                }
            ]
        }
    ]
};

// 欧洲管理框架
export const europeFramework = {
    name: 'ECORD理事会',
    nameEn: 'European Consortium for Ocean Research Drilling',
    color: '#B0E0E6',
    children: [
        {
            name: 'ECORD管理办公室（EMA）',
            nameEn: 'ECORD Management Agency',
            color: '#E6E6FA',
            children: []  // 添加空的 children 数组，保持层级一致
        },
        {
            name: '科学咨询委员会（ESSAC）',
            nameEn: 'ECORD Science Support and Advisory Committee',
            color: '#FFE4B5',
            children: [
                {
                    name: '制定欧洲IODP计划，推荐航次科学家，指导欧洲IODP建议书',
                    color: '#E0F7E0',
                    description: '制定计划、推荐科学家、指导建议书'
                }
            ]
        },
        {
            name: 'MSP管理委员会（EFB）',
            nameEn: 'ECORD Facility Board',
            color: '#98FB98',
            children: [
                {
                    name: '负责制定IODP航次计划，参与成果评审',
                    color: '#E0F7E0',
                    description: '制定计划、评审成果'
                }
            ]
        },
        {
            name: 'MSP科学运营中心（ESO）',
            nameEn: 'ECORD Science Operator',
            color: '#FFB6A3',
            children: [
                {
                    name: '英国地质调查局负责整体管理',
                    color: '#E0F7E0',
                    description: '整体管理'
                },
                {
                    name: '欧洲岩石物理协会负责测井和岩石物理数据保存',
                    color: '#E0F7E0',
                    description: '测井和数据保存'
                },
                {
                    name: '不来梅大学海洋环境中心提供岩芯测试分析和数据库服务',
                    color: '#E0F7E0',
                    description: '岩芯测试和数据服务'
                }
            ]
        }
    ]
};
